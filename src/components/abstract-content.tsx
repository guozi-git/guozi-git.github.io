import s from './factory-preview.module.css';

export function AbstractContent({ text }: { text: string }) {
  const blocks: { list: boolean; paragraphs: string[] }[] = [];
  for (const paragraph of text.split('\n\n')) {
    const list = paragraph.startsWith('• ');
    const content = list ? paragraph.slice(2) : paragraph;
    const previous = blocks.at(-1);
    if (list && previous?.list) previous.paragraphs.push(content);
    else blocks.push({ list, paragraphs: [content] });
  }
  const inline = (text: string) =>
    text
      .split(/([\^_]\{[^}]+\})/g)
      .map((part, index) =>
        part.startsWith('^{') ? (
          <sup key={index}>{part.slice(2, -1)}</sup>
        ) : part.startsWith('_{') ? (
          <sub key={index}>{part.slice(2, -1)}</sub>
        ) : (
          part
        ),
      );
  return (
    <div lang="en" className={s.abstractText}>
      {blocks.map((block, index) =>
        block.list ? (
          <ul key={index}>
            {block.paragraphs.map((paragraph, item) => (
              <li key={item}>{inline(paragraph)}</li>
            ))}
          </ul>
        ) : (
          <p key={index}>{inline(block.paragraphs[0])}</p>
        ),
      )}
    </div>
  );
}
