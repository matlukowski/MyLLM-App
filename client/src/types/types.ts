// types.ts
export interface User {
  id: string;
  username: string;
  avatar: string;
  isFollowing: boolean;
}

export interface PostType {
  id: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string;
    isFollowing?: boolean;
  };
  createdAt: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}
