import { DailyOverviewCard } from "./DailyOverviewCard";
import { RecoveryPanel } from "./RecoveryPanel";
import { SleepPanel } from "./SleepPanel";
import { BodyMetricsPanel } from "./BodyMetricsPanel";
import { CircadianCard } from "./CircadianCard";
import { VitalMetricsPanel } from "./VitalMetricsPanel";
import type {
  SleepLogRow,
  ReadinessRow,
  BodyMeasurementRow,
  MetricRow,
  VitalMetricRow,
} from "../actions";

interface ProfileStats {
  height_cm: number | null;
  date_of_birth: string | null;
  gender: string | null;
}

// Kept for page.tsx import compatibility — no longer used for grid layout
export interface LayoutItem {
  i: string; x: number; y: number; w: number; h: number;
}

export interface HealthContentProps {
  healthLayout?: unknown;
  todaySleep: SleepLogRow | null;
  todayReadiness: ReadinessRow | null;
  todayMeasurement: BodyMeasurementRow | null;
  latestHr: MetricRow | null;
  sleepLogs: SleepLogRow[];
  readinessLogs: ReadinessRow[];
  hrvMetrics: MetricRow[];
  hrMetrics: MetricRow[];
  todaySoreness: Array<{ muscle_group: string; severity: string }>;
  measurements: BodyMeasurementRow[];
  profileStats: ProfileStats | null;
  bpMetrics: VitalMetricRow[];
  gripMetrics: MetricRow[];
  tempMetrics: MetricRow[];
  respMetrics: MetricRow[];
  gutMetrics: MetricRow[];
}

export function HealthContent(props: HealthContentProps) {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Health</h1>
        <p className="text-13 text-text-secondary mt-0.5">Sleep, recovery, and body composition all in one place.</p>
      </div>
      <div className="flex flex-col gap-4">
        <DailyOverviewCard
          todaySleep={props.todaySleep}
          todayReadiness={props.todayReadiness}
          todayMeasurement={props.todayMeasurement}
          latestHr={props.latestHr}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecoveryPanel
            readinessLogs={props.readinessLogs}
            hrvMetrics={props.hrvMetrics}
            hrMetrics={props.hrMetrics}
            todaySoreness={props.todaySoreness}
          />
          <SleepPanel sleepLogs={props.sleepLogs} />
        </div>
        <BodyMetricsPanel measurements={props.measurements} profile={props.profileStats} />
        <CircadianCard sleepLogs={props.sleepLogs} />
        <VitalMetricsPanel
          bpMetrics={props.bpMetrics}
          gripMetrics={props.gripMetrics}
          tempMetrics={props.tempMetrics}
          respMetrics={props.respMetrics}
          gutMetrics={props.gutMetrics}
        />
      </div>
    </div>
  );
}
