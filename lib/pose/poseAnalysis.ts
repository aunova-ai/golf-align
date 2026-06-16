import type { PoseAnalysisResult, PoseAngleResult, PoseLandmarkPoint, PoseSegment } from "@/components/golfalign/types";

type PoseLandmarkerInstance = {
  detect: (image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement) => {
    landmarks?: Array<Array<{ x: number; y: number; z?: number; visibility?: number; presence?: number }>>;
  };
};

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

const landmarkNames = [
  "nose",
  "left_eye_inner",
  "left_eye",
  "left_eye_outer",
  "right_eye_inner",
  "right_eye",
  "right_eye_outer",
  "left_ear",
  "right_ear",
  "mouth_left",
  "mouth_right",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_pinky",
  "right_pinky",
  "left_index",
  "right_index",
  "left_thumb",
  "right_thumb",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
  "left_heel",
  "right_heel",
  "left_foot_index",
  "right_foot_index"
];

const segmentPairs = [
  ["pose_shoulder", "어깨선", 11, 12],
  ["pose_left_upper_arm", "왼쪽 상완", 11, 13],
  ["pose_left_forearm", "왼쪽 전완", 13, 15],
  ["pose_right_upper_arm", "오른쪽 상완", 12, 14],
  ["pose_right_forearm", "오른쪽 전완", 14, 16],
  ["pose_hip", "골반선", 23, 24],
  ["pose_left_body", "왼쪽 몸통", 11, 23],
  ["pose_right_body", "오른쪽 몸통", 12, 24],
  ["pose_left_thigh", "왼쪽 허벅지", 23, 25],
  ["pose_left_shin", "왼쪽 정강이", 25, 27],
  ["pose_right_thigh", "오른쪽 허벅지", 24, 26],
  ["pose_right_shin", "오른쪽 정강이", 26, 28],
  ["pose_stance", "스탠스", 31, 32]
] as const;

let landmarkerPromise: Promise<PoseLandmarkerInstance> | null = null;

async function getPoseLandmarker() {
  if (typeof window === "undefined") {
    throw new Error("Pose analysis is only available in the browser.");
  }

  if (!landmarkerPromise) {
    landmarkerPromise = import("@mediapipe/tasks-vision").then(async ({ FilesetResolver, PoseLandmarker }) => {
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
          delegate: "GPU"
        },
        runningMode: "IMAGE",
        numPoses: 1,
        minPoseDetectionConfidence: 0.45,
        minPosePresenceConfidence: 0.45,
        minTrackingConfidence: 0.45
      }) as Promise<PoseLandmarkerInstance>;
    });
  }

  return landmarkerPromise;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    image.src = src;
  });
}

function visible(point?: PoseLandmarkPoint) {
  return Boolean(point && (point.visibility ?? 1) >= 0.35);
}

function toLandmarkPoint(point: { x: number; y: number; z?: number; visibility?: number }, index: number): PoseLandmarkPoint {
  return {
    id: index,
    name: landmarkNames[index] ?? `landmark_${index}`,
    x: point.x * 100,
    y: point.y * 100,
    z: point.z,
    visibility: point.visibility
  };
}

function angleBetween(a: PoseLandmarkPoint, b: PoseLandmarkPoint, c: PoseLandmarkPoint) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const abLength = Math.hypot(ab.x, ab.y);
  const cbLength = Math.hypot(cb.x, cb.y);
  if (!abLength || !cbLength) {
    return 0;
  }
  const cosine = Math.max(-1, Math.min(1, dot / (abLength * cbLength)));
  return Math.round(Math.acos(cosine) * (180 / Math.PI));
}

function lineTilt(a: PoseLandmarkPoint, b: PoseLandmarkPoint) {
  return Math.round(Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI));
}

function midpoint(a: PoseLandmarkPoint, b: PoseLandmarkPoint) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function buildSegments(points: PoseLandmarkPoint[]) {
  return segmentPairs.reduce<PoseSegment[]>((segments, [id, label, fromIndex, toIndex]) => {
    const from = points[fromIndex];
    const to = points[toIndex];
    if (visible(from) && visible(to)) {
      segments.push({ id, label, from, to });
    }
    return segments;
  }, []);
}

function buildAngles(points: PoseLandmarkPoint[]) {
  const angles: PoseAngleResult[] = [];
  const addJointAngle = (id: string, label: string, aIndex: number, bIndex: number, cIndex: number) => {
    const a = points[aIndex];
    const b = points[bIndex];
    const c = points[cIndex];
    if (visible(a) && visible(b) && visible(c)) {
      angles.push({ id, label, value: angleBetween(a, b, c), x: b.x, y: b.y });
    }
  };

  addJointAngle("angle_left_elbow", "왼팔", 11, 13, 15);
  addJointAngle("angle_right_elbow", "오른팔", 12, 14, 16);
  addJointAngle("angle_left_knee", "왼무릎", 23, 25, 27);
  addJointAngle("angle_right_knee", "오른무릎", 24, 26, 28);

  if (visible(points[11]) && visible(points[12])) {
    const center = midpoint(points[11], points[12]);
    angles.push({ id: "angle_shoulder_tilt", label: "어깨", value: lineTilt(points[11], points[12]), x: center.x, y: center.y });
  }

  if (visible(points[23]) && visible(points[24])) {
    const center = midpoint(points[23], points[24]);
    angles.push({ id: "angle_hip_tilt", label: "골반", value: lineTilt(points[23], points[24]), x: center.x, y: center.y });
  }

  if (visible(points[11]) && visible(points[12]) && visible(points[23]) && visible(points[24])) {
    const shoulder = midpoint(points[11], points[12]);
    const hip = midpoint(points[23], points[24]);
    const spineTilt = Math.round(Math.atan2(shoulder.x - hip.x, hip.y - shoulder.y) * (180 / Math.PI));
    angles.push({ id: "angle_spine_tilt", label: "척추", value: spineTilt, x: (shoulder.x + hip.x) / 2, y: (shoulder.y + hip.y) / 2 });
  }

  return angles;
}

export async function analyzePoseFromImage(imageUrl: string): Promise<PoseAnalysisResult> {
  const [poseLandmarker, image] = await Promise.all([getPoseLandmarker(), loadImage(imageUrl)]);
  const result = poseLandmarker.detect(image);
  const firstPose = result.landmarks?.[0];

  if (!firstPose?.length) {
    throw new Error("사람의 자세를 찾지 못했습니다. 몸 전체가 보이는 장면에서 다시 캡쳐해주세요.");
  }

  const landmarks = firstPose.map(toLandmarkPoint);
  return {
    engine: "mediapipe_pose_landmarker",
    analyzedAt: new Date().toISOString(),
    landmarks,
    segments: buildSegments(landmarks),
    angles: buildAngles(landmarks)
  };
}

