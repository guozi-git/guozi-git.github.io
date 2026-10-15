import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="error-page">
      <p>404</p>
      <h1>页面或文件不存在</h1>
      <p>请检查链接是否完整。如果原文无法打开，请返回论文目录核对。</p>
      <nav aria-label="错误页面导航">
        <Link href="/">返回首页</Link>
        <Link href="/#factory">论文工厂</Link>
      </nav>
    </main>
  );
}
