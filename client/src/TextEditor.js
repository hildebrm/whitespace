import React, { useEffect, useCallback, useState, useRef, use } from 'react'
import Quill from "quill"
import "quill/dist/quill.snow.css"
import { io } from "socket.io-client"
import { useParams } from "react-router-dom"

const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ["code-block"],
    ["clean"],
]
const SAVE_INTERVAL_MS = 500
const PREDICTION_DEBOUNCE_MS = 500
const MIN_CHARS_FOR_PREDICTION = 5

export default function TextEditor() {
    const [socket, setSocket] = useState(null)
    const [quill, setQuill] = useState(null)
    const { id: documentId } = useParams()
    const [isPredicting, setIsPredicting] = useState(false)
    const debounceTimerRef = useRef(null)
    const suggestionRef = useRef(null)
    const customLinkRef = useRef(null)

    useEffect(() => {
        const s = io("http://localhost:3001")
        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    useEffect(() => {
        if (!quill) return;
        
        // Give time for the toolbar to be fully rendered
        setTimeout(() => {
            const toolbars = document.querySelectorAll('.ql-toolbar.ql-snow');
            
            let toolbarElement = null;
            toolbars.forEach(toolbar => {
                // Check if this toolbar is a sibling or connected to our quill instance
                if (toolbar.nextElementSibling === quill.container || 
                    toolbar.parentElement === quill.container.parentElement) {
                    toolbarElement = toolbar;
                }
            });
            
            if (!toolbarElement) {
                console.error("Could not find toolbar element");
                return;
            }
            
            // Check if we already added our custom link to prevent duplicates
            if (toolbarElement.querySelector('.ql-custom-link')) {
                return;
            }
            
            // Create a new format group container
            const formatGroup = document.createElement('span');
            formatGroup.className = 'ql-formats';
            
            // Create the custom link
            const customLink = document.createElement('a');
            customLink.href = '/documents'; // Home redirect
            customLink.className = 'ql-custom-link';
            customLink.title = 'Go to Homepage';
            
            // Create an image element
            const logoImage = document.createElement('img');
            logoImage.src = '/resources/logo2.png'; // Replace with your logo path
            logoImage.alt = 'Home';
            logoImage.style.height = '40px'; // Adjust size as needed
            logoImage.style.width = 'auto';
            logoImage.style.verticalAlign = 'middle';
            
            customLink.appendChild(logoImage);
            
            customLink.setAttribute('style', `
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            `);
            
            customLink.addEventListener('mouseover', () => {
                customLink.style.boxShadow = '0 4px 4px rgba(0, 0, 0, 0.2)';
            });
            
            customLink.addEventListener('mouseout', () => {
                customLink.style.boxShadow = 'none';
            });
            
            customLinkRef.current = customLink;
            
            formatGroup.appendChild(customLink);
            
            toolbarElement.insertBefore(formatGroup, toolbarElement.firstChild);
            
            console.log("Custom logo link added to toolbar on the left side");
        }, 500);
        
        return () => {
            if (customLinkRef.current) {
                const parent = customLinkRef.current.parentElement;
                if (parent) {
                    parent.parentElement?.removeChild(parent);
                }
            }
        };
    }, [quill]);

    useEffect(() => {
        if (socket == null || quill == null) return

        const interval = setInterval(() => {
            socket.emit("save-document", quill.getContents())
        }, SAVE_INTERVAL_MS)

        return () => {
            clearInterval(interval)
        }
    }, [socket, quill])

    useEffect(() => {
        if (socket == null || quill == null) return

        socket.once("load-document", (document) => {
            quill.setContents(document)
            quill.enable()
        })

        socket.emit("get-document", documentId)
    }, [quill, socket, documentId])

    useEffect(() => {
        if (socket == null || quill == null) return
        
        const handler = (delta) => {
            quill.updateContents(delta)
        }
        socket.on("receive-changes", handler)

        return () => {
            socket.off("receive-changes", handler)
        }
    }, [socket, quill])

    const fetchPrediction = async (text) => {
        try {
            setIsPredicting(true)
            const response = await fetch("http://localhost:3001/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            const data = await response.json()
            return data.prediction
        } catch (error) {
            console.error("Error fetching prediction:", error)
            return ""
        } finally {
            setIsPredicting(false)
        }
    };

    const handleTextChange = useCallback(async (delta, oldDelta, source) => {
        if (source !== "user" || !quill || isPredicting) return

        const selection = quill.getSelection();
        if (!selection) return

        if (suggestionRef.current && delta.ops) {
            const insertOp = delta.ops.find(op => op.insert)
            const retainOp = delta.ops.find(op => op.retain)

            if (insertOp && retainOp && retainOp.retain === suggestionRef.current.start) {
                quill.formatText(retainOp.retain, insertOp.insert.length, { 
                    color: 'black', 
                    'user-suggestion': false 
                });
                
                suggestionRef.current.start += insertOp.insert.length;
            }
            else if (insertOp && retainOp && 
                     retainOp.retain > suggestionRef.current.start && 
                     retainOp.retain < suggestionRef.current.start + suggestionRef.current.length) {
                
                // Calculate where in the suggestion they're typing
                const offset = retainOp.retain - suggestionRef.current.start;
                
                quill.formatText(retainOp.retain, insertOp.insert.length, { 
                    color: 'black', 
                    'user-suggestion': false 
                });
                
                const newLength = suggestionRef.current.length - offset;
                suggestionRef.current = {
                    start: retainOp.retain + insertOp.insert.length,
                    length: newLength - insertOp.insert.length
                };
                
                if (suggestionRef.current.length <= 0) {
                    suggestionRef.current = null;
                }
            }
        }
        
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        const cursorPosition = selection.index
        const fullText = quill.getText(0, cursorPosition)
        const contextLength = Math.min(100, cursorPosition)
        const start = Math.max(0, cursorPosition - contextLength)
        const recentText = quill.getText(start, cursorPosition - start)

        if (fullText.length < MIN_CHARS_FOR_PREDICTION) return

        if (suggestionRef.current) {
            quill.deleteText(
                suggestionRef.current.start,
                suggestionRef.current.length,
            )
            suggestionRef.current = null
        }

        debounceTimerRef.current = setTimeout(async () => {
            const prediction = await fetchPrediction(recentText)
            if (prediction && prediction.length > 0 && quill.hasFocus()) {
                const currentSelection = quill.getSelection();
                if (!currentSelection) return;
                
                const currentPosition = currentSelection.index;
                
                quill.insertText(
                    currentPosition, 
                    prediction,
                    { color: '#aaaaaa', 'user-suggestion': true, 'non-editable': true },
                );
                
                suggestionRef.current = {
                    start: currentPosition,
                    length: prediction.length
                };

                quill.setSelection(currentSelection.index, 0);
            }
        }, PREDICTION_DEBOUNCE_MS);
    }, [quill, isPredicting])

    const handleKeyDown = useCallback((event) => {
        console.log("Key pressed:", event.key, "Suggestion:", suggestionRef.current)
        if (!quill || !suggestionRef.current) return

        if (event.key === 'Tab' && suggestionRef.current) {
            event.preventDefault();
            const { start, length } = suggestionRef.current;
            quill.formatText(start, length, { color: 'black', 'user-suggestion': false });
            quill.setSelection(start + length, 0);
            suggestionRef.current = null;
        } else if (event.key === 'Escape' && suggestionRef.current) {
            event.preventDefault();
            
            const { start, length } = suggestionRef.current;
            quill.deleteText(start, length);
            suggestionRef.current = null;
        } else if (event.ctrlKey && event.key === 'ArrowRight' && suggestionRef.current) {
            event.preventDefault();
            const { start, length } = suggestionRef.current;
            
            const text = quill.getText(start, length);
            const nextSpaceIndex = text.indexOf(' ');
            
            let wordLength;
            if (nextSpaceIndex === -1) {
                wordLength = length;
            } else {
                wordLength = nextSpaceIndex + 1;
            }
            
            quill.formatText(start, wordLength, { color: 'black', 'user-suggestion': false });
            
            if (wordLength < length) {
                suggestionRef.current = {
                    start: start + wordLength,
                    length: length - wordLength
                };
            } else {
                suggestionRef.current = null;
            }
            quill.setSelection(start + wordLength, 0);
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    
            const selection = quill.getSelection();
            if (!selection) return;
        
            const { start, length } = suggestionRef.current;
        
            if (selection.index >= start && selection.index <= start + length) {
                quill.setSelection(start, 0);
                event.preventDefault();
            }
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
            const selection = quill.getSelection();
            if (!selection) return;
        
            const { start, length } = suggestionRef.current;
        
            if (selection.index >= start && selection.index <= start + length) {
                quill.deleteText(start, length);
                suggestionRef.current = null;
            }
        }
    }, [quill]);

    const handleClick = useCallback((event) => {
        if (!quill || !suggestionRef.current) return;
    
        const selection = quill.getSelection();
        if (!selection) return;
    
        const { start, length } = suggestionRef.current;
    
        if (selection.index >= start && selection.index <= start + length) {
            quill.setSelection(start, 0);
            event.preventDefault();
        }
    }, [quill]);

    useEffect(() => {
        if (socket == null || quill == null) return

        const handler = (delta, oldDelta, source) => {
            if (source !== "user") return
            socket.emit("send-changes", delta)
        }
        quill.on("text-change", handler)
        quill.on("text-change", handleTextChange)

        if (quill.root) {
            quill.root.addEventListener("keydown", handleKeyDown)
            quill.root.addEventListener("click", handleClick)
        }

        return () => {
            quill.off("text-change", handler)
            quill.off("text-change", handleTextChange)
            if (quill.root) {
                quill.root.removeEventListener("keydown", handleKeyDown)
                quill.root.removeEventListener("click", handleClick)
            }
        }
    }, [socket, quill, handleTextChange, handleKeyDown, handleClick])


    useEffect(() => {
        if (!quill || !quill.root) return;
        
        // Create a handler that runs before Quill's internal handlers
        const preemptiveTabHandler = (e) => {
          if (e.key === 'Tab' && suggestionRef.current) {
            console.log("Intercepted Tab with active suggestion");
            // Stop the event completely
            e.preventDefault();
            e.stopImmediatePropagation();
            
            // Apply the suggestion
            const { start, length } = suggestionRef.current;
            
            // Use a timeout to ensure this runs after the event cycle
            setTimeout(() => {
              quill.formatText(start, length, { color: 'black', 'user-suggestion': false });
              quill.setSelection(start + length, 0);
              suggestionRef.current = null;
            }, 0);
            
            return false;
          }
        };
        
        quill.root.addEventListener('keydown', preemptiveTabHandler, {
          capture: true,
          passive: false
        });
        
        return () => {
          quill.root.removeEventListener('keydown', preemptiveTabHandler, {
            capture: true,
            passive: false
          });
        };
      }, [quill]);
        
    const wrapperRef = useCallback((wrapper) => {
        if (wrapper === null) return

        wrapper.innerHTML = ""
        const editor = document.createElement("div")
        wrapper.append(editor)
        const q = new Quill(editor, {
            theme: "snow",
            modules: { toolbar: TOOLBAR_OPTIONS } })

        q.disable()
        q.setText("")

        setQuill(q)

    }, [])
  return (
        <div className="container">
            <div className="editor-container" ref={wrapperRef}></div>
            {isPredicting && (
                <div className="prediction-indicator">
                    <small>Thinking...</small>
                </div>
            )}
        </div>
    )
}
