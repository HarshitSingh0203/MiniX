import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../services/apiConfig";
import { getConversations, sendMessage, startConversation } from "../services/chatApi";
import { searchUsers } from "../services/userApi";
import "./Page.css";
import "./Chat.css";

function Chat({ onNavigate }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === activeId),
    [activeId, conversations]
  );

  useEffect(() => {
    getConversations()
      .then((data) => {
        setConversations(data);
        setActiveId(data[0]?._id || "");
      })
      .catch((error) => setError(error.message));
  }, []);

  const getRecipient = (conversation) =>
    conversation.participants.find((person) => person._id !== user._id) ||
    conversation.participants[0];

  const handleSearch = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setPeople((await searchUsers(query)).filter((person) => person._id !== user._id));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleStart = async (recipientId) => {
    try {
      const conversation = await startConversation(recipientId);
      setConversations((current) => {
        const others = current.filter((item) => item._id !== conversation._id);
        return [conversation, ...others];
      });
      setActiveId(conversation._id);
      setPeople([]);
      setQuery("");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!message.trim() || !activeConversation) return;

    try {
      const newMessage = await sendMessage(activeConversation._id, message);
      setConversations((current) =>
        current.map((conversation) =>
          conversation._id === activeConversation._id
            ? { ...conversation, messages: [...conversation.messages, newMessage] }
            : conversation
        )
      );
      setMessage("");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <section className="page-content">
      <div className="page-title"><h1>Messages</h1></div>

      <form className="chat-search" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people to message"
        />
        <button className="primary-button" type="submit">Search</button>
      </form>

      {error && <p className="error-message list-message">{error}</p>}

      {people.length > 0 && (
        <div className="people-results">
          {people.map((person) => (
            <button key={person._id} onClick={() => handleStart(person._id)}>
              <span className="avatar small-avatar">
                {person.profilePic ? (
                  <img src={getImageUrl(person.profilePic)} alt={person.name} />
                ) : (
                  person.name.charAt(0).toUpperCase()
                )}
              </span>
              <span><strong>{person.name}</strong><small>@{person.username}</small></span>
            </button>
          ))}
        </div>
      )}

      <div className="chat-shell">
        <div className="conversation-list">
          {conversations.length === 0 && (
            <p className="empty-chat">Search for someone to start a DM.</p>
          )}
          {conversations.map((conversation) => {
            const recipient = getRecipient(conversation);
            const latest = conversation.messages[conversation.messages.length - 1];

            return (
              <button
                key={conversation._id}
                className={conversation._id === activeId ? "active" : ""}
                onClick={() => setActiveId(conversation._id)}
              >
                <span className="avatar small-avatar">
                  {recipient.profilePic ? (
                    <img src={getImageUrl(recipient.profilePic)} alt={recipient.name} />
                  ) : (
                    recipient.name.charAt(0).toUpperCase()
                  )}
                </span>
                <span>
                  <strong>{recipient.name}</strong>
                  <small>{latest?.text || `@${recipient.username}`}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="message-panel">
          {activeConversation ? (
            <>
              <div className="message-header">
                <button onClick={() => onNavigate("profile", getRecipient(activeConversation).username)}>
                  @{getRecipient(activeConversation).username}
                </button>
              </div>

              <div className="message-list">
                {activeConversation.messages.length === 0 && (
                  <p className="empty-chat">No messages yet.</p>
                )}
                {activeConversation.messages.map((item) => (
                  <div
                    key={item._id}
                    className={item.sender?._id === user._id ? "message own" : "message"}
                  >
                    {item.text}
                  </div>
                ))}
              </div>

              <form className="message-form" onSubmit={handleSend}>
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write a message"
                />
                <button className="primary-button" type="submit">Send</button>
              </form>
            </>
          ) : (
            <p className="empty-chat">Choose a conversation.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Chat;
