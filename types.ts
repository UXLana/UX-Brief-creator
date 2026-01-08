export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface BriefSection {
  id: string;
  title: string;
  description: string;
  content: string;
  isLocked: boolean;
  lastEditedBy: User | null;
  lastEditedAt: number;
}

export interface Comment {
  id: string;
  sectionId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: number;
}

export interface BriefState {
  title: string;
  status: 'draft' | 'review' | 'approved';
  sections: BriefSection[];
  comments: Comment[];
  updatedAt: number;
}

export const USERS: User[] = [
  { id: 'u1', name: 'Alex Designer', avatar: 'https://picsum.photos/seed/alex/32/32', color: 'bg-blue-500' },
  { id: 'u2', name: 'Jordan PM', avatar: 'https://picsum.photos/seed/jordan/32/32', color: 'bg-emerald-500' },
  { id: 'u3', name: 'Casey Eng', avatar: 'https://picsum.photos/seed/casey/32/32', color: 'bg-purple-500' },
];