import { academicLevels, levelDescriptions } from '@/lib/research-reviews';
import { scoreDimensions } from '@/lib/factory-papers';
import s from './research-review-preview.module.css';

const distinctions: Record<string, string> = {
  S0: '尚未形成有效研究贡献。未评分不属于这一等级。',
  S1: '有狭窄但有效的补充或实例；完成证明本身不足以说明问题具有更高价值。',
  S2: '对特定算法或模型增加可靠事实；相比 S1，有更明确的专业用途，但覆盖范围和迁移性仍有限。',
  S3: '有明确、可供后续研究使用的理论增量；相比 S2，更强调结果的独立用途，而非仅补全特例。',
  S4: '推进重要问题或揭示新机制，在更广研究中有持续价值；孤立模型的常数改进或单个边界补证通常不足以达到这一层次。',
  S5: '突破领域核心问题，或形成足以改变研究路线的普遍框架；关键区别是突破的广度和作用，而非技术复杂度。',
  S6: '达到范式创造的层次，改变理解或研究问题的基本方式；不能仅凭高分或期刊名称认定。',
};
function GuideTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <table className={s.guideTable}>
      <caption>{title}</caption>
      <thead>
        <tr>
          {headers.map((h) => (
            <th scope="col" key={h}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, ...cells]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            {cells.map((cell, i) => (
              <td key={i}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export function ResearchGradeGuide({ theme = 'default' }: { theme?: 'default' | 'gold' }) {
  return (
    <section className={`${s.explanation} ${s.guide} ${theme === 'gold' ? s.goldGuide : ''}`}>
      <h4 className={s.guideHeading}>等级与评分说明</h4>
      <GuideTable
        title="学术等级 S：各级的分数范围与实质区别"
        headers={['等级 / 名称', '分数范围', '含义与相邻级别的区别']}
        rows={[...academicLevels]
          .reverse()
          .map(([code, label, range]) => [
            `${code} · ${label}`,
            range,
            distinctions[code] ?? levelDescriptions[code],
          ])}
      />
      <p>
        分数范围是数值条件，贡献层次是实质条件，二者须同时满足。特别是 S4
        及以上，不能仅靠加权分晋级。当前报告没有授予 S5、S6。
      </p>
      <GuideTable
        title="正确性 C：证明是否经过核验"
        headers={['状态', '含义', '对整稿评分的影响']}
        rows={[
          [
            '待核验',
            '关键证书或数学输入尚未核实，暂不赋 C 等级；不等于已经发现反例。',
            '暂不赋整稿五维分、综合分及 S 等级。',
          ],
          [
            'C2 · 重要证明缺口',
            '已识别出影响证明闭合的实质缺口；与“材料尚待核实”不同。',
            '整稿暂不评分；明确限定的已核子结果可单独评价。',
          ],
          [
            'C3 · 核验通过',
            '所审证明链与关键独立检查通过；不等同于形式化认证。',
            '在已核范围内进入原创性与价值评分；正确性通过不保证学术等级高。',
          ],
          [
            'C4 · 更充分验证',
            '需要更充分的复现与独立同行验证，验证强度高于 C3。',
            '当前报告未授予；不能由 C3 或高分自动推得。',
          ],
        ].reverse()}
      />
      <GuideTable
        title="原创性 O：新贡献体现在哪里"
        headers={['等级', '贡献特征', '与相邻层次的区别']}
        rows={[
          ['待定', '整稿原创性尚未赋级。', '不能把研究愿景或未核主张当成已完成的新贡献。'],
          [
            'O1 · 有限补充',
            '以已有框架下的边界补证、特定参数或实例补充为主。',
            '有增量，但独立的新方法或新机制仍有限。',
          ],
          [
            'O2 · 受限的新结果',
            '在限定模型或结构中得到明确的新结果。',
            '相比 O1，新结果更明确；尚未形成较广泛、可复用的理论增量。',
          ],
          [
            'O3 · 实质理论增量',
            '形成具有独立用途的新结论、锐边界或理论联系。',
            '相比 O2，更强调实质性和后续用途，而非仅增加一个特例。',
          ],
          [
            'O4 · 明确的新贡献',
            '有明确的新机制或重要新结论，须结合已有文献说明增量。',
            '相比 O3，贡献的机制或问题价值更突出；不把沿用的经典工具重复计为原创。',
          ],
        ].reverse()}
      />
      <p>
        O1–O4
        的文字是结合本批逐篇比较的阅读提示，不对应固定分数区间，也不是全球首创认证。未对报告未使用的原创性等级另设定义。
      </p>
      <GuideTable
        title="四类指标：评价对象不同，不能混为一谈"
        headers={['指标', '评价对象', '如何使用']}
        rows={[
          [
            '综合分 / S 等级',
            '论文整体的已完成研究贡献。',
            '综合分按下表权重计算；S 等级同时考虑实质贡献门槛。',
          ],
          [
            '核心贡献 / C-S 等级',
            '最重要的独立已核结果。',
            'C-S0 至 C-S6 沿用上方 S0 至 S6 的分段与贡献层次，但只评价核心结果，不是正确性 C 等级。',
          ],
          [
            '已核子结果',
            '整稿尚未通过评分门槛时，明确限定的已核部分。',
            '可以列核心分及 C-S 等级，但不代表整稿成立，也不能代替整稿综合分。',
          ],
          [
            '后续研究潜力',
            '可推进的研究路线及其潜在价值。',
            '不是成功概率，不计入当前综合分或 S 等级。',
          ],
        ]}
      />
      <GuideTable
        title="五维评分：评价重点与计算权重"
        headers={['维度', '权重', '评价重点']}
        rows={scoreDimensions.map((d, i) => [d.name, `${[30, 25, 20, 15, 10][i]}%`, d.description])}
      />
      <p>
        综合分为五维加权和，不是简单平均。核心贡献与潜力不重复计入。小数用于复核计算，不表示统计测量精度；未评分不等于零分，不参与综合排名。
      </p>
    </section>
  );
}
