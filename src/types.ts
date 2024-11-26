  
  export enum PostState {
    DRAFT_INPUT = "DRAFT_INPUT",
    POST_SUBMITTED = "POST_SUBMITTED"
  }
  
  export const STORAGE_KEYS = {
      DRAFT_POST: "draft_post"
  } as const;
  
  
  
  export interface DraftPost {
    title: string;
    quote: string;
    url: string;
    comments: string;
  }

