export interface Task {
  id: string
  title: string
  notes: string
  status: 'inbox' | 'in_progress' | 'blocked' | 'done' | 'archived'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  updates: TaskUpdate[]
  created_at: string
  updated_at: string
}

export interface TaskUpdate {
  text: string
  time: string
}

export interface Message {
  id: string
  content: string
  sender: 'user' | 'pete'
  created_at: string
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
}
