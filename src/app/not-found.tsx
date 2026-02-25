import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="glass-card max-w-md p-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-white">404</h1>
        <p className="mt-2 text-sm text-gray-400">页面不存在</p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          返回首页
        </Link>
      </div>
    </main>
  );
}
