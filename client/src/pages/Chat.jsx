import { useEffect, useState } from "react";
import { FaEdit, FaSearch, FaTimes } from "react-icons/fa";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { getConversations, sendMessage, startConversation } from "../services/chatApi";
import { searchUsers } from "../services/userApi";
import "./Page.css";
import "./Chat.css";

function Chat({ onNavigate }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [conversationQuery, setConversationQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [people, setPeople] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Find the conversation the user clicked in the left list.
  const activeConversation = conversations.find((conversation) => conversation._id === activeId);

  useEffect(() => {
    // Load all conversations for the logged-in user.
    getConversations()
      .then(setConversations)
      .catch((error) => setError(error.message));
  }, []);

  const getRecipient = (conversation) => {
    // The recipient is the other person in the two-person conversation.
    return (
      conversation.participants.find((person) => person._id !== user._id) ||
      conversation.participants[0]
    );
  };

  const isFollowed = (person) => {
    return user.following?.some((id) => (id._id || id).toString() === person._id);
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredConversations = conversations.filter((conversation) => {
    const recipient = getRecipient(conversation);
    const text = `${recipient.name} ${recipient.username}`.toLowerCase();
    return text.includes(conversationQuery.trim().toLowerCase());
  });

  const handleSearchUsers = async (event) => {
    event.preventDefault();
    try {
      setError("");
      const results = await searchUsers(userQuery);
      setPeople(results.filter((person) => person._id !== user._id));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleStart = async (person) => {
    if (!isFollowed(person)) {
      setError("You can only message people you follow");
      return;
    }

    try {
      setError("");
      const conversation = await startConversation(person._id);

      // Put the new or existing conversation at the top.
      setConversations((current) => {
        const others = current.filter((item) => item._id !== conversation._id);
        return [conversation, ...others];
      });
      setActiveId(conversation._id);
      setShowNewChat(false);
      setPeople([]);
      setUserQuery("");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!message.trim() || !activeConversation) return;

    try {
      setError("");
      const newMessage = await sendMessage(activeConversation._id, message);

      // Add the new message and move this conversation to the top.
      setConversations((current) => [
        {
          ...activeConversation,
          messages: [...activeConversation.messages, newMessage],
          updatedAt: newMessage.createdAt,
        },
        ...current.filter((conversation) => conversation._id !== activeConversation._id),
      ]);
      setMessage("");
    } catch (error) {
      setError(error.message);
    }
  };

  const renderConversation = (conversation) => {
    const recipient = getRecipient(conversation);
    const latest = conversation.messages[conversation.messages.length - 1];

    return (
      <button
        key={conversation._id}
        className={conversation._id === activeId ? "active" : ""}
        onClick={() => setActiveId(conversation._id)}
      >
        <UserAvatar as="span" className="avatar small-avatar" user={recipient} alt={recipient.name} />
        <span className="conversation-copy">
          <span className="conversation-topline">
            <strong>{recipient.name}</strong>
            <time>{formatTime(latest?.createdAt || conversation.updatedAt)}</time>
          </span>
          <small>@{recipient.username}</small>
          <em>{latest?.text || "No messages yet"}</em>
        </span>
      </button>
    );
  };

  return (
    <section className="page-content dm-page">
      <div className="dm-shell">
        <aside className="dm-left">
          <div className="dm-left-header">
            <h1>Messages</h1>
            <button type="button" onClick={() => setShowNewChat(true)} aria-label="New chat">
              <FaEdit />
            </button>
          </div>

          <label className="dm-search">
            <FaSearch />
            <input
              value={conversationQuery}
              onChange={(event) => setConversationQuery(event.target.value)}
              placeholder="Search Direct Messages"
            />
          </label>

          {error && <p className="dm-error">{error}</p>}

          <div className="conversation-list">
            {filteredConversations.length === 0 && (
              <p className="empty-chat">No conversations found.</p>
            )}
            {filteredConversations.map(renderConversation)}
          </div>
        </aside>

        <div className="message-panel">
          {activeConversation ? (
            <>
              <div className="message-header">
                <button onClick={() => onNavigate("profile", getRecipient(activeConversation).username)}>
                  <UserAvatar as="span" className="avatar small-avatar" user={getRecipient(activeConversation)} />
                  <span>
                    <strong>{getRecipient(activeConversation).name}</strong>
                    <small>@{getRecipient(activeConversation).username}</small>
                  </span>
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
                    <span>{item.text}</span>
                    <time>{formatTime(item.createdAt)}</time>
                  </div>
                ))}
              </div>

              <form className="message-form" onSubmit={handleSend}>
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Start a new message"
                />
                <button className="primary-button" type="submit">Send</button>
              </form>
            </>
          ) : (
            <div className="dm-empty-state">
              <h2>Select a message</h2>
              <p>Choose from your existing conversations or start a new private DM.</p>
              <button className="primary-button" onClick={() => setShowNewChat(true)}>New Chat</button>
            </div>
          )}
        </div>
      </div>

      {showNewChat && (
        <div className="new-chat-modal" role="dialog" aria-modal="true">
          <div className="new-chat-backdrop" onClick={() => setShowNewChat(false)} />
          <div className="new-chat-dialog">
            <div className="new-chat-header">
              <button type="button" onClick={() => setShowNewChat(false)} aria-label="Close new chat">
                <FaTimes />
              </button>
              <h2>New message</h2>
            </div>

            <form className="new-chat-search" onSubmit={handleSearchUsers}>
              <FaSearch />
              <input
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
                placeholder="Search people you follow"
              />
            </form>

            <div className="people-results">
              {people.length === 0 && (
                <p className="empty-chat">Search for someone you follow.</p>
              )}
              {people.map((person) => {
                const allowed = isFollowed(person);
                return (
                  <button
                    key={person._id}
                    className={!allowed ? "disabled-person" : ""}
                    onClick={() => handleStart(person)}
                  >
                    <UserAvatar as="span" className="avatar small-avatar" user={person} alt={person.name} />
                    <span>
                      <strong>{person.name}</strong>
                      <small>@{person.username}</small>
                      {!allowed && <em>You can only message people you follow</em>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Chat;
