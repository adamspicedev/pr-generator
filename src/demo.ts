import { GitChanges, ChangedFile } from './types.js';
import { detectBackendEndpoints, detectFrontendChanges } from './git.js';

export function createDemoChanges(): GitChanges {
  const files: ChangedFile[] = [
    {
      path: 'src/api/endpoints.ts',
      status: 'modified',
      additions: 45,
      deletions: 12,
      diff: `+ import express from 'express';
+ 
+ const router = express.Router();
+ 
+ // GET /api/users - Get all users
+ router.get('/users', async (req, res) => {
+   try {
+     const users = await User.findAll();
+     res.json(users);
+   } catch (error) {
+     res.status(500).json({ error: 'Failed to fetch users' });
+   }
+ });
+ 
+ // POST /api/users - Create a new user
+ router.post('/users', async (req, res) => {
+   try {
+     const { name, email, password } = req.body;
+     const user = await User.create({ name, email, password });
+     res.status(201).json(user);
+   } catch (error) {
+     res.status(400).json({ error: 'Failed to create user' });
+   }
+ });`,
      content: undefined
    },
    {
      path: 'src/components/UserList.tsx',
      status: 'added',
      additions: 67,
      deletions: 0,
      diff: `+ import React, { useState, useEffect } from 'react';
+ import { User } from '../types/user';
+ 
+ interface UserListProps {
+   onUserSelect?: (user: User) => void;
+ }
+ 
+ export const UserList: React.FC<UserListProps> = ({ onUserSelect }) => {
+   const [users, setUsers] = useState<User[]>([]);
+   const [loading, setLoading] = useState(true);
+   const [error, setError] = useState<string | null>(null);
+ 
+   useEffect(() => {
+     fetchUsers();
+   }, []);
+ 
+   const fetchUsers = async () => {
+     try {
+       setLoading(true);
+       const response = await fetch('/api/users');
+       if (!response.ok) {
+         throw new Error('Failed to fetch users');
+       }
+       const data = await response.json();
+       setUsers(data);
+     } catch (err) {
+       setError(err instanceof Error ? err.message : 'Unknown error');
+     } finally {
+       setLoading(false);
+     }
+   };`,
      content: undefined
    },
    {
      path: 'src/types/user.ts',
      status: 'added',
      additions: 23,
      deletions: 0,
      diff: `+ export interface User {
+   id: number;
+   name: string;
+   email: string;
+   createdAt: Date;
+   updatedAt: Date;
+ }
+ 
+ export interface CreateUserRequest {
+   name: string;
+   email: string;
+   password: string;
+ }
+ 
+ export interface UpdateUserRequest {
+   name?: string;
+   email?: string;
+ }`,
      content: undefined
    }
  ];

  return {
    files,
    summary: 'Changes in 3 files: 135 additions, 12 deletions',
    branchName: 'feature/user-management',
    baseBranch: 'main'
  };
}

export function generateDemoPR(): string {
  const changes = createDemoChanges();
  // These variables are used for demonstration purposes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const backendEndpoints = detectBackendEndpoints(changes.files);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const frontendChanges = detectFrontendChanges(changes.files);

  return `# [Brief, descriptive title of the main change]

## Overview
This section should provide a concise summary of what this PR accomplishes. Include the main goal, scope, and any high-level context that reviewers need to understand the changes.

## Key Changes

### Backend Changes
This section should document any backend modifications including:
- New API endpoints added or modified
- Database schema changes
- Server-side logic updates
- Configuration changes
- Performance improvements

### Frontend Changes
This section should cover frontend modifications such as:
- New components or pages added
- UI/UX improvements
- State management changes
- Integration with backend APIs
- Responsive design updates

### Infrastructure Changes
This section should include any infrastructure updates like:
- Deployment configuration changes
- Environment variable updates
- Build process modifications
- Third-party service integrations

## Testing Considerations
This section should outline what needs to be tested, including:
- Specific test scenarios to verify
- Edge cases to consider
- Integration testing requirements
- Performance testing needs
- User acceptance testing criteria

## Notes for Reviewers
This section should highlight areas that need special attention during review:
- Complex logic that needs careful review
- Breaking changes or migrations
- Security considerations
- Performance implications
- Areas where additional testing might be needed

## Impact
This section should describe the broader impact of these changes:
- How this affects users or other systems
- Performance implications
- Security considerations
- Future maintenance implications
- Any dependencies or prerequisites

## API Changes Diagram

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant D as Database

    C->>S: [API Request]
    S->>D: [Database Query]
    D-->>S: [Response Data]
    S-->>C: [API Response]
\`\`\`

This diagram shows the flow of API interactions when backend endpoints are modified. It should illustrate the request/response cycle and any database or external service interactions.`;
} 