import { posts } from '@/lib/posts';

export function Blog() {
  const entries = [...posts].sort(
    (a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.id.localeCompare(b.id),
  );

  return (
    <section className="blog-content" aria-labelledby="blog-list-title">
      <div className="blog-heading">
        <div>
          <p className="eyebrow">NOTES ALONG THE WAY</p>
          <h3 id="blog-list-title">写一点，留一点。</h3>
        </div>
        <span className="blog-count">{entries.length} 篇记录</span>
      </div>
      <p className="blog-intro">
        我是一个看视频都不愿意发表评论的人，因此除非遇到极其抽象的事情，这里应该都不会有太多内容。
      </p>
      <div className="blog-list-header" aria-hidden="true">
        <span>日期 / DATE</span>
        <span>随笔 / NOTES</span>
        <span>↓ 最新在前</span>
      </div>
      {entries.length ? (
        <ol className="blog-list">
          {entries.map((post) => (
            <li key={post.id}>
              <details className="blog-entry" id={`post-${post.id}`}>
                <summary>
                  {post.date ? (
                    <time dateTime={post.date}>{post.date.replaceAll('-', '.')}</time>
                  ) : (
                    <span className="blog-undated">随笔</span>
                  )}
                  <span className="blog-entry-copy">
                    <strong>{post.title}</strong>
                    {post.summary && <span>{post.summary}</span>}
                  </span>
                </summary>
                <article className="blog-article" aria-label={post.title}>
                  {post.paragraphs.map((paragraph, index) => (
                    <p key={`${post.id}-${index}`}>{paragraph}</p>
                  ))}
                </article>
              </details>
            </li>
          ))}
        </ol>
      ) : (
        <div className="blog-empty">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M14 14h36v42H14zM22 27h20M22 35h20M22 43h12" />
            <path d="m40 8 8 5-16 24-9 5 1-10Z" />
          </svg>
          <p>第一篇，还在路上。</p>
          <span>之后的想法和记录，会慢慢放在这里。</span>
        </div>
      )}
      <p className="blog-footer">不定期更新，长短随意。</p>
    </section>
  );
}
