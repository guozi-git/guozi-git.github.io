import type { ResearchReview } from '@/lib/research-reviews';
import { scoreDimensions } from '@/lib/score-dimensions';
import { ScoreRadar } from './score-radar';
import { academicLevels, levelDescriptions, originalityLabels } from '@/lib/research-levels';
import { p089Dimensions } from '@/lib/research-p089-notes';
import s from './research-review-preview.module.css';

export function ResearchReviewPreview({
  review,
  workshop = false,
}: {
  review: ResearchReview;
  workshop?: boolean;
}) {
  const level = academicLevels.find(([code]) => code === review.academic_level);
  const scored = review.score_eligible && review.dimensions !== null;
  return (
    <section className={`${s.review} ${workshop ? s.workshop : ''}`} aria-label="研究评价">
      <header className={s.heading}>
        <span>RESEARCH ASSESSMENT</span>
        <h3>研究评价</h3>
        <p>论文整体、核心贡献与后续潜力，分别判断。</p>
      </header>
      <div className={s.overview}>
        <div className={s.total}>
          <span>研究综合得分</span>
          <strong>
            {review.research_score?.toFixed(2) ?? '—'}
            {scored && <small> / 100</small>}
          </strong>
          <p>{scored ? '五维固定权重加权' : '整稿暂不评分，不参与综合排名'}</p>
        </div>
        <div className={s.level}>
          <span>学术等级</span>
          <strong>{review.academic_level ?? '待定'}</strong>
          <b>{level?.[1]}</b>
          <p>
            {review.academic_level
              ? levelDescriptions[review.academic_level]
              : '整体尚未通过评分门槛；已核子结果单独列示，不代表整稿成立。'}
          </p>
        </div>
      </div>
      <div className={s.gates}>
        <div>
          <span>正确性</span>
          <b>
            {review.correctness
              ? `${review.correctness} · ${review.correctness === 'C3' ? '正确性检验通过' : '重要证明缺口'}`
              : '关键证书待核验'}
          </b>
          <p>
            {review.correctness === 'C3'
              ? '所审证明链与关键独立检查通过；不等同于形式化认证或外部同行验证。'
              : review.correctness === 'C2'
                ? '整体证明链存在实质缺口，已核子结果与未闭合部分分别判断。'
                : '尚缺可核实的关键数学输入，暂不赋正确性等级；不等于发现反例。'}
          </p>
        </div>
        <div>
          <span>原创性</span>
          <b>
            {review.originality === '待定'
              ? '待定'
              : `${review.originality} · ${originalityLabels[review.originality] ?? ''}`}
          </b>
          <p>{review.novelty}</p>
        </div>
      </div>
      {scored && (
        <section className={s.dimensions}>
          <div className={s.sectionTitle}>
            <h4>五维评分</h4>
            <span>各项满分 100</span>
          </div>
          <div className={`${s.radar} ${s.reviewRadar}`}>
            <ScoreRadar
              id={`review-P${review.id}`}
              scores={review.dimensions!}
              theme={workshop ? 'default' : 'gold'}
            />
          </div>
          <section className={s.ratingReasons} aria-label="评分依据">
            <h4>评分依据</h4>
            <dl>
              {(review.id === 89
                ? p089Dimensions.map((d) => [d.name, d.reason])
                : review.dimension_reasons
                  ? review.dimension_reasons.map((reason, i) => [scoreDimensions[i].name, reason])
                  : [
                      ['创新增量', review.novelty],
                      ['学术意义', review.need],
                      ['成果边界', review.limits],
                    ]
              ).map(([name, reason]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{reason}</dd>
                </div>
              ))}
            </dl>
          </section>
        </section>
      )}
      <div className={s.secondary}>
        <section>
          <span>{scored ? '核心贡献' : '已核子结果 · 核心贡献'}</span>
          <div className={s.metric}>
            {review.core_score !== null && (
              <strong>
                {review.core_score}
                <small> / 100</small>
              </strong>
            )}
            <b>{review.core_contribution_level}</b>
          </div>
          <h4>{review.id === 89 ? '固定目标上的冷启动实现' : '最重要的已核结果'}</h4>
          <p>{review.main}</p>
          <small>
            {scored
              ? '单独评价最重要的已核理论结果，不再计入综合分。'
              : '仅评价上述已核子结果，不代表整稿核心主张全部通过。'}
          </small>
        </section>
        <section>
          <span>后续研究潜力</span>
          <div className={s.metric}>
            <strong>
              {review.future}
              <small> / 100</small>
            </strong>
          </div>
          <h4>可推进的研究方向</h4>
          <p>{review.route}</p>
          <small>评价研究路线，不是成功概率，也不计入当前成果等级。</small>
        </section>
      </div>
      {scored && (
        <section className={s.journals}>
          <div className={s.sectionTitle}>
            <h4>期刊定位</h4>
          </div>
          <dl>
            {(['Recommended', 'Competitive', 'Ambitious'] as const).map(
              (key, i) =>
                review.journal_names[key] && (
                  <div key={key}>
                    <dt>
                      {
                        (review.journal_fit
                          ? ['首选', '备选', '挑战目标']
                          : ['推荐', '竞争目标', '挑战目标'])[i]
                      }
                    </dt>
                    <dd>{review.journal_names[key]}</dd>
                  </div>
                ),
            )}
          </dl>
        </section>
      )}
      <section className={s.boundary}>
        <h4>适用范围与局限</h4>
        <p>{review.limits}</p>
      </section>
      <section className={s.boundary}>
        <h4>整体评价</h4>
        <p>{review.need}</p>
      </section>
    </section>
  );
}
