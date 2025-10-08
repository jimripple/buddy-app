export type ReviewRequest = {
  projectId: string;
  sceneId: string;
  sceneText: string;
  projectTitle: string;
};

export type ReviewResponse = {
  summary: string[];
  strengths: string[];
  critiques: string[];
  challenge: string;
};

export interface Reviewer {
  review(request: ReviewRequest): Promise<ReviewResponse>;
}

export class MockReviewer implements Reviewer {
  async review({ sceneText, projectTitle }: ReviewRequest): Promise<ReviewResponse> {
    const wordCount = sceneText.trim().split(/\s+/).filter(Boolean).length;
    const sentences = sceneText.split(/(?<=[.!?])\s+/).filter(Boolean);

    return {
      summary: [
        `Scene from "${projectTitle}" with roughly ${wordCount} words.`,
        sentences[0]?.slice(0, 120) || "Introduce your protagonist and central tension early.",
      ],
      strengths: [
        "Strong sense of atmosphere.",
        "Dialogue reveals character intent.",
      ],
      critiques: [
        "Consider clarifying the stakes during the opening paragraph.",
        "Tighten pacing by trimming redundant description.",
      ],
      challenge: "Write one paragraph that raises the stakes for your protagonist.",
    };
  }
}

export function getReviewer(): Reviewer {
  return new MockReviewer();
}
