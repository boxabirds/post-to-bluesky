import { useAuthState, AuthState } from "~hooks/useAuthState";
import { Login } from "~components/Login";
import { Post } from "~components/Post";
import icon from "data-base64:/assets/icon.png";
import "./style.css";

function IndexPopup() {
  const auth = useAuthState();  

  return (
    <div className="px-5 pt-3 pb-4 w-[380px]">
      <h1 className="text-primary dark:text-white text-2xl font-thin flex gap-2 items-center">
        <img src={icon} alt="Bluesky icon" className="h-[1em]" />
        Post to Bluesky
      </h1>
      
      {auth.authState === AuthState.AUTHENTICATED ? <Post /> : <Login />}
    </div>
  );
}

export default IndexPopup;