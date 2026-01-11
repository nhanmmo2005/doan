import { http } from "./http";

export async function fetchComments(postId) {
  const res = await http.get(`/api/comments/post/${postId}`);
  return res.data;
}

export async function createComment(postId, payload) {
  const res = await http.post(`/api/comments/post/${postId}`, payload);
  return res.data;
}

export async function deleteComment(commentId) {
  const res = await http.delete(`/api/comments/${commentId}`);
  return res.data;
}
