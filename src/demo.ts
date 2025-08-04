import { GitChanges, ChangedFile } from './types';
import { detectBackendEndpoints, detectFrontendChanges } from './git';

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
  const backendEndpoints = detectBackendEndpoints(changes.files);
  const frontendChanges = detectFrontendChanges(changes.files);

  return `# User Management System Implementation

## Overview
This PR implements a comprehensive user management system with RESTful API endpoints, React frontend components, and TypeScript type definitions. The changes provide a complete user CRUD functionality with proper error handling and type safety.

## Key Changes

### Backend API Endpoints
- **Added** \`src/api/endpoints.ts\` - Express router with user management endpoints
  - \`GET /api/users\` - Retrieve all users
  - \`POST /api/users\` - Create new user with validation
  - \`PUT /api/users/:id\` - Update existing user

### Frontend Components
- **Added** \`src/components/UserList.tsx\` - React component for displaying users
  - Implements loading states and error handling
  - Fetches data from the new API endpoints
  - Provides user selection functionality
  - Responsive grid layout for user cards

### TypeScript Types
- **Added** \`src/types/user.ts\` - Type definitions for user management
  - \`User\` interface with all required fields
  - \`CreateUserRequest\` for user creation
  - \`UpdateUserRequest\` for user updates

## Testing Considerations
- Test all API endpoints with various input scenarios
- Verify error handling for invalid requests
- Test frontend component with different data states
- Validate TypeScript type safety across the application
- Test user interaction flows and state management

## Notes for Reviewers
- Pay attention to API error handling and status codes
- Verify TypeScript interfaces are comprehensive
- Check React component performance and re-rendering
- Ensure proper separation of concerns between layers
- Review security considerations for user data handling

## Impact
This implementation provides a solid foundation for user management functionality. The modular design allows for easy extension and maintenance. The TypeScript integration ensures type safety throughout the application.

## API Changes Diagram

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant D as Database

    C->>S: GET /api/users
    S->>D: Query all users
    D-->>S: User data
    S-->>C: JSON response

    C->>S: POST /api/users
    S->>S: Validate input
    S->>D: Create user
    D-->>S: New user data
    S-->>C: 201 Created

    C->>S: PUT /api/users/:id
    S->>S: Validate input
    S->>D: Update user
    D-->>S: Updated user data
    S-->>C: JSON response
\`\`\``;
} 