import { useCallback, useEffect, useRef, useState } from "react";
import { FaCalendarAlt, FaCamera, FaTimes } from "react-icons/fa";
import EditMediaModal from "../components/EditMediaModal";
import PostCard from "../components/PostCard";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { getAllPosts, getPostsByUser } from "../services/postApi";
import { getImageUrl } from "../services/apiConfig";
import { getUser, toggleFollow, updateProfile } from "../services/userApi";
import "./Page.css";
import "./Profile.css";

function Profile({ username, onNavigate }) {
  const { user, saveUser } = useAuth();
  const profileUsername = username || user.username;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", username: "", email: "", bio: "" });
  const [profilePic, setProfilePic] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [mediaEditor, setMediaEditor] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const profileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const applyProfileData = useCallback((profileData, postData, liked) => {
    setProfile(profileData);
    setPosts(postData);
    setLikedPosts(liked);
    setActiveTab("posts");
    setFormData({
      name: profileData.name || "",
      username: profileData.username || "",
      email: profileData.email || user.email || "",
      bio: profileData.bio || "",
    });
  }, [user.email]);

  const loadProfile = useCallback(async () => {
    // Load the profile, that user's posts, and all posts for the Likes tab.
    const [profileData, postData, allPosts] = await Promise.all([
      getUser(profileUsername),
      getPostsByUser(profileUsername),
      getAllPosts(),
    ]);

    const liked = getLikedPosts(allPosts, profileData._id);
    applyProfileData(profileData, postData, liked);
  }, [applyProfileData, profileUsername]);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const [profileData, postData, allPosts] = await Promise.all([
          getUser(profileUsername),
          getPostsByUser(profileUsername),
          getAllPosts(),
        ]);

        if (ignore) return;

        const liked = getLikedPosts(allPosts, profileData._id);
        applyProfileData(profileData, postData, liked);
      } catch (error) {
        if (!ignore) setError(error.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [applyProfileData, profileUsername]);

  const isOwnProfile = profile?._id === user._id;
  const isFollowing = profile?.followers?.some((id) => (id._id || id).toString() === user._id);
  const mediaPosts = posts.filter((post) => (post.repostOf || post).image);
  let visiblePosts = posts;

  // Pick which post list should be shown in the current tab.
  if (activeTab === "media") visiblePosts = mediaPosts;
  if (activeTab === "likes") visiblePosts = likedPosts;

  const handleFollow = async () => {
    try {
      // Toggle follow on the server, then reload counts and button text.
      await toggleFollow(profile._id);
      await loadProfile();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleChange = (event) => {
    // Update the edit form field that changed.
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const data = new FormData();

    // Send text fields and optional profile/banner images together.
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (profilePic) data.append("profilePic", profilePic);
    if (bannerImage) data.append("bannerImage", bannerImage);

    try {
      const updatedUser = await updateProfile(data);
      saveUser({ ...user, ...updatedUser, token: localStorage.getItem("token") });
      setEditing(false);
      setProfilePic(null);
      setBannerImage(null);
      setProfilePicPreview("");
      setBannerPreview("");
      setMediaEditor(null);

      if (updatedUser.username !== profileUsername) {
        onNavigate("profile", updatedUser.username);
      } else {
        await loadProfile();
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "";

  const openEditModal = () => {
    // Show existing images in the edit modal before choosing new ones.
    setProfilePicPreview(profile?.profilePic ? getImageUrl(profile.profilePic) : "");
    setBannerPreview(profile?.bannerImage ? getImageUrl(profile.bannerImage) : "");
    setEditing(true);
  };

  const handleMediaSelect = (event, type) => {
    const file = event.target.files[0] || null;
    if (!file) return;

    const sourceUrl = URL.createObjectURL(file);
    setMediaEditor({
      type,
      url: sourceUrl,
      fileName: file.name,
      aspect: type === "banner" ? 3 : 1,
    });
    event.target.value = "";
  };

  const handleApplyMedia = ({ file, previewUrl }) => {
    if (mediaEditor.type === "banner") {
      setBannerImage(file);
      setBannerPreview(previewUrl);
    } else {
      setProfilePic(file);
      setProfilePicPreview(previewUrl);
    }
    setMediaEditor(null);
  };

  if (loading) return <p className="status-message">Loading profile...</p>;
  if (error && !profile) return <p className="error-message list-message">{error}</p>;

  return (
    <section className="page-content">
      <div className="profile-title">
        <h1>{profile?.name || "Profile"}</h1>
        <span>{posts.length} posts</span>
      </div>

      {profile && (
        <div className="x-profile">
          <div className="profile-banner">
            {profile.bannerImage && <img src={getImageUrl(profile.bannerImage)} alt="" />}
          </div>

          <div className="profile-summary">
            <UserAvatar
              as="button"
              className="profile-avatar avatar"
              user={profile}
              alt={profile.name}
              onClick={() => onNavigate("profile", profile.username)}
            />

            <div className="profile-action-row">
              {isOwnProfile ? (
                <button className="outline-button" onClick={openEditModal}>Edit Profile</button>
              ) : (
                <button className="primary-button follow-button" onClick={handleFollow}>
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>

            <div className="profile-info">
              <h2>{profile.name}</h2>
              <button onClick={() => onNavigate("profile", profile.username)}>@{profile.username}</button>
              <p className="profile-bio">{profile.bio || "No bio yet."}</p>
              {joinedDate && (
                <p className="joined-date">
                  <FaCalendarAlt />
                  Joined {joinedDate}
                </p>
              )}
              <div className="profile-stats">
                <span><strong>{profile.following?.length || 0}</strong> Following</span>
                <span><strong>{profile.followers?.length || 0}</strong> Followers</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="error-message list-message">{error}</p>}

      <div className="profile-tabs">
        {["posts", "media", "likes"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {visiblePosts.length === 0 && <p className="status-message">{getEmptyMessage(activeTab)}</p>}
      {visiblePosts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onDelete={(id) => setPosts(posts.filter((item) => item._id !== id))}
          onOpenProfile={(name) => onNavigate("profile", name)}
        />
      ))}

      {editing && (
        <div className="profile-modal" role="dialog" aria-modal="true">
          <div className="profile-modal-backdrop" onClick={() => setEditing(false)} />
          <form className="profile-modal-dialog" onSubmit={handleUpdate}>
            <div className="profile-modal-header">
              <button type="button" onClick={() => setEditing(false)} aria-label="Close edit profile">
                <FaTimes />
              </button>
              <h2>Edit Profile</h2>
              <button className="primary-button" type="submit">Save</button>
            </div>

            <div className="edit-profile-media">
              <div className="edit-banner-preview">
                {bannerPreview && <img src={bannerPreview} alt="" />}
                <button type="button" onClick={() => bannerInputRef.current?.click()} aria-label="Edit banner image">
                  <FaCamera />
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleMediaSelect(event, "banner")}
                />
              </div>

              <div className="edit-avatar-preview">
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="" />
                ) : (
                  <UserAvatar as="span" className="avatar" user={profile} />
                )}
                <button type="button" onClick={() => profileInputRef.current?.click()} aria-label="Edit profile image">
                  <FaCamera />
                </button>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleMediaSelect(event, "profile")}
                />
              </div>
            </div>

            <label>
              Name
              <input name="name" value={formData.name} onChange={handleChange} required />
            </label>
            <label>
              Username
              <input name="username" value={formData.username} onChange={handleChange} required />
            </label>
            <label>
              Bio
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" />
            </label>
          </form>
        </div>
      )}

      {mediaEditor && (
        <EditMediaModal
          source={mediaEditor}
          aspect={mediaEditor.aspect}
          title="Edit Media"
          onApply={handleApplyMedia}
          onCancel={() => setMediaEditor(null)}
        />
      )}
    </section>
  );
}

const getLikedPosts = (allPosts, userId) => {
  return allPosts.filter((post) => {
    const realPost = post.repostOf || post;
    const likes = realPost.likes || [];

    return likes.some((id) => (id._id || id).toString() === userId);
  });
};

const getEmptyMessage = (activeTab) => {
  if (activeTab === "media") return "No media posts yet.";
  if (activeTab === "likes") return "No liked posts yet.";
  return "No posts yet.";
};

export default Profile;
