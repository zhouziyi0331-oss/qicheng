"use client";
import { useState, useEffect } from "react";
import { storyApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";

interface Post {
  id: string;
  user_id: string;
  nickname: string;
  opc_label: string;
  content: string;
  task_title: string;
  earning: number;
  likes: number;
  is_liked: boolean;
  created_at: string;
}

export default function StoryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [composing, setComposing] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);
  const { show } = useToast();

  const loadPosts = (p: number) => {
    storyApi.feed(p).then(({ data }) => {
      const items = data.data || [];
      if (p === 1) setPosts(items);
      else setPosts((prev) => [...prev, ...items]);
      setHasMore(items.length === 20);
    }).catch(() => show("加载失败", "error")).finally(() => setLoading(false));
  };

  useEffect(() => { loadPosts(1); }, []);

  const handleLike = async (postId: string) => {
    try {
      await storyApi.like(postId);
      setPosts((ps) => ps.map((p) =>
        p.id === postId
          ? { ...p, likes: p.is_liked ? p.likes - 1 : p.likes + 1, is_liked: !p.is_liked }
          : p
      ));
    } catch {
      show("操作失败", "error");
    }
  };

  const handlePost = async () => {
    if (!newContent.trim()) return show("内容不能为空", "error");
    setPosting(true);
    try {
      const { data } = await storyApi.createPost(newContent.trim());
      setPosts((ps) => [data.data, ...ps]);
      setNewContent("");
      setComposing(false);
      show("分享成功！", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "发布失败", "error");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>故事墙</h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
            每个人都在按自己的节奏成长 · 没有排名，只有故事
          </p>
        </div>
        <button
          onClick={() => setComposing((v) => !v)}
          className="text-sm px-3 py-1.5 rounded-md"
          style={{ background: "#238636", border: "1px solid #2ea043", color: "white" }}
        >
          + 分享故事
        </button>
      </div>

      {/* 发帖框 */}
      {composing && (
        <div className="p-4 rounded-lg mb-4 fade-in" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <textarea
            className="w-full h-28 resize-none p-3 rounded-lg text-sm mb-3"
            placeholder="分享你的成长故事、完成任务的心得、对其他同学的鼓励...（平台会自动屏蔽联系方式）"
            style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "#484f58" }}>{newContent.length}/500</span>
            <div className="flex gap-2">
              <button onClick={() => { setComposing(false); setNewContent(""); }}
                className="text-xs px-3 py-1.5 rounded"
                style={{ background: "#21262d", border: "1px solid #30363d", color: "#8b949e" }}>
                取消
              </button>
              <button onClick={handlePost} disabled={posting}
                className="text-xs px-3 py-1.5 rounded"
                style={{ background: "#238636", border: "1px solid #2ea043", color: "white" }}>
                {posting ? "发布中..." : "发布"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-24" style={{ color: "#484f58" }}>
          <div className="text-4xl mb-4">🌱</div>
          <p>故事墙还没有故事</p>
          <p className="text-sm mt-2">完成第一单后，你的故事将出现在这里</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-5 rounded-lg fade-in"
            style={{ background: "#161b22", border: "1px solid #30363d" }}
          >
            {/* 头部 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "#1f3358", color: "#58a6ff" }}
                >
                  {post.nickname?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{post.nickname}</p>
                  {post.opc_label && (
                    <p className="text-xs" style={{ color: "#8b949e" }}>{post.opc_label}</p>
                  )}
                </div>
              </div>
              <p className="text-xs" style={{ color: "#484f58" }}>
                {new Date(post.created_at).toLocaleDateString("zh-CN")}
              </p>
            </div>

            {/* 任务标签 */}
            {post.task_title && (
              <div className="mb-3">
                <Badge color="blue">完成任务：{post.task_title}</Badge>
              </div>
            )}

            {/* 内容 */}
            <p className="text-sm leading-relaxed mb-3" style={{ color: "#e6edf3" }}>
              {post.content}
            </p>

            {/* 底部 */}
            <div className="flex items-center justify-between">
              {post.earning > 0 && (
                <span className="text-sm font-medium" style={{ color: "#3fb950" }}>
                  + ¥{post.earning}
                </span>
              )}
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-colors ml-auto"
                style={{
                  background: post.is_liked ? "#1f3358" : "#21262d",
                  border: `1px solid ${post.is_liked ? "#58a6ff" : "#30363d"}`,
                  color: post.is_liked ? "#58a6ff" : "#8b949e",
                }}
              >
                {post.is_liked ? "❤️" : "🤍"} {post.likes}
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && !loading && posts.length > 0 && (
        <button
          onClick={() => { setPage((p) => p + 1); loadPosts(page + 1); }}
          className="w-full mt-6 py-3 rounded-lg text-sm transition-colors"
          style={{ background: "#21262d", border: "1px solid #30363d", color: "#8b949e" }}
        >
          加载更多
        </button>
      )}
    </div>
  );
}
