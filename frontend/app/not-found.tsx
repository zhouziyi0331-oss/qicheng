import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center fade-in">
        <div className="text-6xl font-bold mb-4" style={{ color: "#30363d" }}>404</div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: "#e6edf3" }}>页面不存在</h1>
        <p className="mb-8" style={{ color: "#8b949e" }}>你访问的页面已消失，或者从未存在过</p>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-white no-underline"
          style={{ background: "#238636", border: "1px solid #2ea043" }}
        >
          回到首页
        </Link>
      </div>
    </div>
  );
}
