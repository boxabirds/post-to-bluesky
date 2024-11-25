// components/Post.tsx
import { type FormEvent, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { PostState } from "~types";

export function Post() {
  const [postState, setPostState] = useState<PostState>(PostState.DRAFT_INPUT);
  const [postContent, setPostContent] = useState("");
  
  const isLoading = postState === PostState.POST_SUBMITTED;

  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    setPostState(PostState.POST_SUBMITTED);
    try {
      // Your post logic here
    } catch (error) {
      setPostState(PostState.DRAFT_INPUT);
    }
  };

  return (
    <form onSubmit={handlePost} className="mt-4">
      {/* Your post form fields */}
      <div className="flex justify-between items-center">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <button type="submit" className="...">
            Post
          </button>
        )}
      </div>
    </form>
  );
}
