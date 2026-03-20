import Link from "next/link";
import {
  contractTypeLabels,
  describePrivacy,
  intelEventLabels,
  riskLevelLabels,
  type IntelEvent,
} from "@eve/shared";

export function IntelEventFeed({ events }: { events: IntelEvent[] }) {
  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Intel events</p>
          <h2>Recent frontier reports</h2>
        </div>
        <span className="subtle">Aggregated, delayed, and actor-safe reports</span>
      </div>
      <div className="event-feed">
        {events.map((event) => (
          <article key={event.id} className="panel event-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">{intelEventLabels[event.type]}</p>
                <strong>{event.title}</strong>
              </div>
              <span className="status-pill">{riskLevelLabels[event.riskLevel]}</span>
            </div>
            <p className="muted">{event.summary}</p>
            <dl className="score-grid">
              <div>
                <dt>Region</dt>
                <dd>{event.regionName}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{event.confidence}%</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{event.source}</dd>
              </div>
              <div>
                <dt>Recommended</dt>
                <dd>
                  {event.recommendedContractType
                    ? contractTypeLabels[event.recommendedContractType]
                    : "OBSERVE"}
                </dd>
              </div>
            </dl>
            <p className="muted small-copy">{describePrivacy(event.privacy)}</p>
            <div className="card-actions">
              <span className="subtle">{new Date(event.timestamp).toLocaleString()}</span>
              {event.recommendedContractType && event.resourceName ? (
                <Link
                  href={`/contracts?type=${event.recommendedContractType}&resource=${encodeURIComponent(event.resourceName)}&region=${encodeURIComponent(event.regionName)}`}
                  className="button secondary"
                >
                  Create contract
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
