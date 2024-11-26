  
  export enum PostState {
    DRAFT_INPUT = "DRAFT_INPUT",
    POST_SUBMITTED = "POST_SUBMITTED"
  }
  
  export const MESSAGE_TYPE = {
    ERROR: "error",
    SUCCESS: "success",
  } as const;
  
  export const MESSAGE_NAMES = {
    LOGIN: "login",
    POST: "post"
  } as const;
  
  export const STORAGE_KEYS = {
      DRAFT_POST: "draft_post",
  
  } as const;
  export const BSKY_DOMAIN = "bsky.social";
  
  export const AUTH_FACTOR_TOKEN_REQUIRED_ERROR_MESSAGE = "A sign in code has been sent to your email address";
  export const RATE_LIMIT_ERROR_MESSAGE = "Bluesky is busy, please try again later.";
  export const MAX_RELOAD_COUNT = 3;
  
  export interface DraftPost {
    title: string;
    quote: string;
    url: string;
    comments: string;
  }
  