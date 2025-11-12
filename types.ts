export interface Message {
  id: number;
  sender: 'user' | 'model' | 'system';
  text: string;
}

export interface AudioSample {
  title: string;
  text: string;
}

export interface Lesson {
  day: number;
  title: string;
  description: string;
  audioSamples?: AudioSample[];
  practiceScript?: {
    title: string;
    script: string;
  };
}

export interface Drill {
  title: string;
  duration: string;
  description:string;
}
