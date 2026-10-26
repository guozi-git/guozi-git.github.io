import { SectionLoading } from './section-loading';
export function PaperDeliveryStatus({ error }: { error: boolean }) {
  return error ? (
    <div role="alert">
      <p>论文内容未能载入，可返回列表或重新加载。</p>
      <button onClick={() => window.location.reload()}>重新加载此页</button>
    </div>
  ) : (
    <SectionLoading name="论文内容" />
  );
}
