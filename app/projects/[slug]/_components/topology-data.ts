/**
 * Cloud Waste Hunter — production topology graph.
 *
 * Single source of truth for both the 3D scene and the 2D mobile
 * fallback. 12 nodes, ~10 service-to-service edges, all anchored to
 * the actual flow described in data/projects.ts and Note
 * "cloud-waste-hunter-architecture".
 *
 * Node positions are expressed as polar angles (degrees, 0° = +X).
 * The 3D scene plots them around the ring of radius `RING_RADIUS`;
 * the 2D fallback projects the same angles to SVG coordinates.
 */

export type NodeCategory =
  | "saas"
  | "compute"
  | "data"
  | "ai"
  | "events"
  | "auth"
  | "edge";

export interface TopologyNode {
  id: string;
  label: string;
  category: NodeCategory;
  blurb: string;
  /** Polar angle around the ring, degrees. Ignored for the center node. */
  angleDeg: number;
}

export const RING_RADIUS = 4.2;

export const TOPOLOGY_NODES: readonly TopologyNode[] = [
  {
    id: "cwh",
    label: "Cloud Waste Hunter",
    category: "saas",
    blurb: "FastAPI on Lambda. The product layer that ties every service below into a single FinOps workflow.",
    angleDeg: 0, // center
  },
  { id: "cloudfront", label: "CloudFront",   category: "edge",    blurb: "TLS termination + cache for the SaaS frontend.", angleDeg: 0   },
  { id: "apigw",      label: "API Gateway",  category: "edge",    blurb: "Public HTTPS edge in front of the Lambda backend.", angleDeg: 33  },
  { id: "cognito",    label: "Cognito",      category: "auth",    blurb: "User pool + Google IdP, JWT-authorised at API Gateway.", angleDeg: 66  },
  { id: "lambda",     label: "Lambda",       category: "compute", blurb: "FastAPI container image. Self-invoke pattern bypasses the 30s API GW timeout.", angleDeg: 99  },
  { id: "dynamodb",   label: "DynamoDB",     category: "data",    blurb: "Six tables — accounts, scans, findings, billing, sessions, audit.", angleDeg: 132 },
  { id: "bedrock",    label: "Bedrock",      category: "ai",      blurb: "Claude Haiku streams CLI + Terraform remediation per finding.", angleDeg: 165 },
  { id: "s3",         label: "S3",           category: "data",    blurb: "CUR 2.0 parquet drop zone + Glue catalog backing store.", angleDeg: 198 },
  { id: "glue",       label: "Glue",         category: "data",    blurb: "Crawls CUR parquet, maintains the Athena schema.", angleDeg: 231 },
  { id: "athena",     label: "Athena",       category: "data",    blurb: "Serverless SQL over CUR — every waste figure is tied to a real line item.", angleDeg: 264 },
  { id: "eventbridge",label: "EventBridge",  category: "events",  blurb: "Cron + event bus for recurring scans and replays.", angleDeg: 297 },
  { id: "sqs",        label: "SQS",          category: "events",  blurb: "Decouples scan dispatch from the API request.", angleDeg: 330 },
] as const;

export interface TopologyEdge {
  from: string;
  to: string;
}

/**
 * Edges expressed as service-to-service calls. We omit the trivial
 * "CWH → every node" star — the visual implies it from the central
 * node's position, and rendering 11 redundant spokes would clutter
 * the scene. Each edge below is a real runtime dependency, not a
 * conceptual "is part of" association.
 */
export const TOPOLOGY_EDGES: readonly TopologyEdge[] = [
  { from: "cloudfront",  to: "apigw"    },
  { from: "apigw",       to: "lambda"   },
  { from: "apigw",       to: "cognito"  },
  { from: "lambda",      to: "dynamodb" },
  { from: "lambda",      to: "bedrock"  },
  { from: "lambda",      to: "s3"       },
  { from: "glue",        to: "s3"       },
  { from: "athena",      to: "glue"     },
  { from: "eventbridge", to: "sqs"      },
  { from: "sqs",         to: "lambda"   },
  { from: "cwh",         to: "lambda"   },
  { from: "cwh",         to: "cloudfront"},
] as const;

/** Cyan-leaning color per category, expressed as hex for both r3f and SVG. */
export const NODE_COLOR: Record<NodeCategory, string> = {
  saas:    "#ffffff", // CWH stands out
  compute: "#00d2ff",
  data:    "#5db4f5",
  ai:      "#7be2ff",
  events:  "#3f9adf",
  auth:    "#90c7ec",
  edge:    "#aee5ff",
};
