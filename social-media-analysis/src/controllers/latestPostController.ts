import { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://20.244.56.144/evaluation-service';
const API_TOKEN = "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ2NjMyNTE2LCJpYXQiOjE3NDY2MzIyMTYsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjBlMGY2NWMxLTdkYmItNGU1NC05YzViLWEzYTZkMTAzMTljZCIsInN1YiI6InJpc2h1b2JyYXk3NTZAZ21haWwuY29tIn0sImVtYWlsIjoicmlzaHVvYnJheTc1NkBnbWFpbC5jb20iLCJuYW1lIjoicmlzaHUgcmFqIiwicm9sbE5vIjoiNG5pMjJpczE3MiIsImFjY2Vzc0NvZGUiOiJEUllzY0UiLCJjbGllbnRJRCI6IjBlMGY2NWMxLTdkYmItNGU1NC05YzViLWEzYTZkMTAzMTljZCIsImNsaWVudFNlY3JldCI6ImNxbmhuRkRZdHFEZG1lR2UifQ._0EPKAIAlRsLG5HrzldAoAtTsdvDnea4zDRPxgk-Wmc"


export const getPosts = async (req: Request, res: Response) => {
  const type = req.query.type;

  if (!type || (type !== 'latest' && type !== 'popular')) {
     res.status(400).json({ error: 'Query param "type" must be latest or popular' });
  }

  try {
    // Step 1: Fetch all users
    const usersRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `${API_TOKEN}` },
    });
    const usersData = await usersRes.json();
    const userIds = Object.keys(usersData.users);

    let allPosts: any[] = [];

    // Step 2: Fetch all posts from all users
    for (const userId of userIds) {
      const postsRes = await fetch(`${BASE_URL}/users/${userId}/posts`, {
        headers: { Authorization: `${API_TOKEN}` },
      });

      if (!postsRes.ok) continue;

      const postsData = await postsRes.json();
      allPosts.push(...postsData.posts);
    }

    if (type === 'latest') {
      // Step 3A: Sort by ID descending and return latest 5
      const latestPosts = allPosts.sort((a, b) => b.id - a.id).slice(0, 5);
       res.json(latestPosts);
    }

    if (type === 'popular') {
      // Step 3B: Fetch comment count per post
      const commentCounts: Record<number, number> = {};

      for (const post of allPosts) {
        try {
          const commentRes = await fetch(`${BASE_URL}/posts/${post.id}/comments`, {
            headers: { Authorization: `${API_TOKEN}` },
          });

          if (!commentRes.ok) continue;

          const commentData = await commentRes.json();
          commentCounts[post.id] = commentData.comments.length;
        } catch {
          commentCounts[post.id] = 0;
        }
      }

      // Step 4: Find max comment count
      const maxCount = Math.max(...Object.values(commentCounts));

      // Step 5: Filter posts with max comments
      const popularPosts = allPosts.filter(post => commentCounts[post.id] === maxCount);
       res.json(popularPosts);
    }
  } catch (err) {
    console.error(err);
     res.status(500).json({ error: 'Failed to fetch posts' });
  }
};
