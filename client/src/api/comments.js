// src/api/comments.js
import { http } from "./http";

export async function fetchComments(postId) {
  const res = await http.get(`/api/comments/post/${postId}`);
  return res.data;
}

export async function createComment(postId, payload) {
  const res = await http.post(`/api/comments/${postId}`, payload);
  return res.data;
}

export async function deleteComment(id) {
  const res = await http.delete(`/api/comments/${id}`);
  return res.data;
}

// ✅ ADD
export async function updateComment(id, payload) {
  const res = await http.put(`/api/comments/${id}`, payload);
  return res.data;
}
