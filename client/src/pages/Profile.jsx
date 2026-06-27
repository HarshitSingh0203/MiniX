import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { getPostsByUser } from "../services/postApi";
import { getUser, toggleFollow, updateProfile } from "../services/userApi";
import { getImageUrl } from "../services/apiConfig";
import "./Page.css";
import "./Profile.css";

function Profile({ username, onNavigate }) {
  const { user, saveUser } = useAuth();
  const profileUsername = username || user.username;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", username: "", email: "", bio: "" });
  const [profilePic, setProfilePic] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const [profileData, postData] = await Promise.all([
        getUser(profileUsername),
        getPostsByUser(profileUsername),
      ]);
      setProfile(profileData);
      setPosts(postData);
      setFormData({
        name: profileData.name || "",
        username: profileData.username || "",
        email: profileData.email || "",
        bio: profileData.bio || "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    Promise.all([getUser(profileUsername), getPostsByUser(profileUsername)])
      .then(([profileData, postData]) => {
        if (ignore) return;
        setProfile(profileData);
        setPosts(postData);
        setFormData({
          name: profileData.name || "",
          username: profileData.username || "",
          email: profileData.email || "",
          bio: profileData.bio || "",
        });
      })
      .catch((error) => {
        if (!ignore) setError(error.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [profileUsername]);

  const isOwnProfile = profile?._id === user._id;
  const isFollowing = profile?.followers?.some((id) => (id._id || id).toString() === user._id);

  const handleFollow = async () => {
    try {
      await toggleFollow(profile._id);
      await loadProfile();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (profilePic) data.append("profilePic", profilePic);

    try {
      const updatedUser = await updateProfile(data);
      saveUser({ ...user, ...updatedUser, token: localStorage.getItem("token") });
      setEditing(false);
      setProfilePic(null);

      if (updatedUser.username !== profileUsername) {
        onNavigate("profile", updatedUser.username);
      } else {
        await loadProfile();
      }
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <p className="status-message">Loading profile...</p>;
  if (error && !profile) return <p className="error-message list-message">{error}</p>;

  return (
    <section className="page-content">
      <div className="page-title"><h1>Profile</h1></div>

      {profile && (
        <div className="profile-header">
          <div className="profile-avatar avatar">
            {profile.profilePic ? (
              <img src={getImageUrl(profile.profilePic)} alt={profile.name} />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="profile-info">
            <h2>{profile.name}</h2>
            <p>@{profile.username}</p>
            <p className="profile-bio">{profile.bio || "No bio yet."}</p>
            <div className="profile-stats">
              <span><strong>{profile.following.length}</strong> Following</span>
              <span><strong>{profile.followers.length}</strong> Followers</span>
            </div>
          </div>

          {isOwnProfile ? (
            <button className="outline-button" onClick={() => setEditing(!editing)}>Edit profile</button>
          ) : (
            <button className="primary-button follow-button" onClick={handleFollow}>
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>
      )}

      {error && <p className="error-message list-message">{error}</p>}

      {editing && (
        <form className="edit-profile-form" onSubmit={handleUpdate}>
          <h3>Edit profile</h3>
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
          <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" required />
          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
          <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Bio" rows="3" />
          <input type="file" accept="image/*" onChange={(event) => setProfilePic(event.target.files[0] || null)} />
          <button className="primary-button" type="submit">Save changes</button>
        </form>
      )}

      <h2 className="section-heading">Posts</h2>
      {posts.length === 0 && <p className="status-message">No posts yet.</p>}
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onDelete={(id) => setPosts(posts.filter((item) => item._id !== id))}
          onOpenProfile={(name) => onNavigate("profile", name)}
        />
      ))}
    </section>
  );
}

export default Profile;
