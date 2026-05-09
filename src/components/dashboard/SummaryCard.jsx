import Card from '../ui/Card';

export default function SummaryCard({ label, value, hint }) {
  return (
    <Card className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </Card>
  );
}
