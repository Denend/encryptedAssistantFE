import { Logo } from "../particles/Logo";
import { useEffect, useState } from "react";
import axios from "axios";
import clsx from "clsx";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/hljs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { emojiMap } from "../particles/EmojMap";

export const HomePage = () => {
  const [response, setResponse] = useState(() => {
    const savedChats = localStorage.getItem("chatHistory");
    return savedChats ? JSON.parse(savedChats) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);

  const [copyValue, setCopyValue] = useState("Copy");

  useEffect(() => {
    if (response.length === 0) {
      setResponse([{ sender: "bot", text: "How can I help you?" }]);
    }
  }, [response.length]);

  useEffect(() => {
    if (response.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(response));
    }

    window.scrollTo({
      top: document.documentElement.scrollHeight + window.innerHeight,
      behavior: "smooth",
    });
  }, [response]);

  const url = "https://api.encryptedassistant.xyz/ask";

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setValue("");
    setIsLoading(true);
    setIsDisabled(true);

    try {
      const userMessage = { sender: "user", text: value };
      setResponse((prev) => [...prev, userMessage]);

      const apiResponse = await axios.post(
        url,
        { message: value },
        { headers: { "Content-Type": "application/json" } }
      );

      setResponse((prev) => {
        const newPrev = [...prev];
        newPrev[newPrev.length - 1] = {
          ...newPrev[newPrev.length - 1],
          prompt_tx_url: apiResponse.data.prompt_tx_url,
          prompt_ipfs_url: apiResponse.data.prompt_url,
        };
        return newPrev;
      });

      const botMessage = {
        sender: "bot",
        text: apiResponse.data.answer,
        answer_tx_url: apiResponse.data.answer_tx_url,
        answer_ipfs_url: apiResponse.data.answer_url,
      };
      setResponse((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);

      setResponse((prev) => [
        ...prev,
        { sender: "error", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      setIsDisabled(false);
    }
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch(e);
    } else if (e.key === "Enter" && e.shiftKey) {
      const cursorPosition = e.target.selectionStart;
      const textBefore = value.slice(0, cursorPosition);
      const textAfter = value.slice(cursorPosition);

      setValue(`${textBefore}\n${textAfter}`);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = cursorPosition + 1;
      }, 0);
    }
  };

  const clearChat = () => {
    setResponse([]);
    localStorage.removeItem("chatHistory");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyValue("Copied");
      setTimeout(function () {
        setCopyValue("Copy");
      }, 1000);
    });
  };

  const MarkdownWithEmojis = ({ text }) => {
    function EmojiText({ children }) {
      const childArray = Array.isArray(children) ? children : [children];
      
      return (
        <>
          {childArray.map((child, i) => {
            if (typeof child === "string") {
              return child.split(/(:[a-zA-Z0-9_]+:)/g).map((piece, j) =>
                emojiMap[piece] ? (
                  <img
                    key={`${i}-${j}`}
                    src={emojiMap[piece]}
                    alt={piece}
                    style={{
                      width: "24px",
                      height: "24px",
                      verticalAlign: "middle",
                      display: "inline-block",
                    }}
                  />
                ) : (
                  piece
                )
              );
            }
            return child;
          })}
        </>
      );
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: EmojiText,
          li: EmojiText,
          a: ({ node, ...props }) => (
            <a target="_blank" rel="noreferrer" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong style={{ fontWeight: "bold" }} {...props} />
          ),
          em: ({ node, ...props }) => (
            <em style={{ fontStyle: "italic" }} {...props} />
          ),
          code({ node, inline, className, children, ...props }) {
            return !inline ? (
              <div style={{ position: "relative" }}>
                <SyntaxHighlighter
                  language={(className || "").replace("language-", "")}
                  style={dracula}
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
                <button
                  className="copy-button"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 2,
                    fontSize: 12,
                  }}
                  onClick={() => copyToClipboard(String(children))}
                  type="button"
                >
                  {copyValue}
                </button>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <div className="container">
      <nav className="nav">
        <Logo />
        <ul>
          <li>
            <a href="https://x.com/solodanETH" target="_blank" rel="noreferrer">
              X
            </a>
          </li>
          <li>
            <a href="https://t.me/@daniel_solo" target="_blank" rel="noreferrer">
              Telegram
            </a>
          </li>
          <li>
            <a href="https://github.com/Denend" target="_blank" rel="noreferrer">
              Github
            </a>
          </li>
        </ul>
      </nav>
      <main className="main">
        <div className="chat-history">
          {response.map((msg, index) => (
            <div
              key={index}
              className={clsx(
                "message",
                (msg.answer_tx_url || msg.prompt_tx_url) && "got-hash",
                {
                  "message-user": msg.sender === "user",
                  "message-bot": msg.sender === "bot",
                  "message-error": msg.sender === "error",
                }
              )}
            >
              <MarkdownWithEmojis text={msg.text} />
              {msg.sender === "bot" && msg.answer_tx_url && (
                <div className="hash-link">
                  <a href={msg.answer_tx_url} target="_blank" rel="noreferrer">
                    TX Link
                  </a>
                  {msg.answer_ipfs_url && (
                    <>
                    <span style={{ margin: "0 5px", display: "inline-block" }}> | </span>
                    <a href={msg.answer_ipfs_url} target="_blank" rel="noreferrer">
                      IPFS Link
                    </a>
                    </>
                  )}
                </div>
              )}
              {msg.sender === "user" && msg.prompt_tx_url && (
                <div className="hash-link">
                  <a href={msg.prompt_tx_url} target="_blank" rel="noreferrer">
                    TX Link
                  </a>
                  {msg.prompt_ipfs_url && (
                    <>
                    <span style={{ margin: "0 5px", display: "inline-block" }}> | </span>
                    <a href={msg.prompt_ipfs_url} target="_blank" rel="noreferrer">
                      IPFS Link
                    </a>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="loading">
              <p className="generating">Generating...</p>
            </div>
          )}
        </div>
      </main>

      <div className="search__container">
        <div className="search">
          <form onSubmit={handleSearch} className="search__input">
            <textarea
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              value={value}
              name="chat"
              placeholder="Message for Encrypted Assistant"
            />
            <div className="search__input_nav">
              <button type="button" onClick={clearChat} disabled={isLoading}>
                Clear
              </button>
              <span className="xs-text">Created by daniel_6773</span>
              <button type="submit" disabled={isDisabled}>
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
