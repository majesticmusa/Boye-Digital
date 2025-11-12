import { Lesson } from '../types';

export const lessons: Lesson[] = [
  {
    day: 1,
    title: 'Understanding Cadence',
    description: 'Cadence is the rhythm and flow of your speech. Good cadence makes you sound confident and engaging, while poor cadence can be monotonous or distracting. It\'s about varying your pace, using pauses, and emphasizing the right words to keep your audience hooked.',
    audioSamples: [
      {
        title: 'Monotonous Cadence (Less Effective)',
        text: 'Hello my name is and I want to talk to you about something that is very important for your business.'
      },
      {
        title: 'Dynamic Cadence (More Effective)',
        text: 'Hello! My name is... and I want to talk to you about something that is VERY important... for your business.'
      }
    ]
  },
  {
    day: 2,
    title: 'Mastering Pauses',
    description: 'Silence is a powerful tool. A well-placed pause can build suspense, add emphasis to a key point, or give your audience a moment to absorb what you\'ve said. Don\'t be afraid to embrace the quiet; it makes your words matter more.',
    audioSamples: [
      {
        title: 'Without Pauses (Rushed)',
        text: 'If you want to grow you need a sales funnel a system that attracts nurtures and converts clients.'
      },
      {
        title: 'With Pauses (Impactful)',
        text: 'If you want to grow... you need a sales funnel. A system that ATTRACTS leads... NURTURES them... and CONVERTS them into paying clients.'
      }
    ]
  },
  {
    day: 3,
    title: 'Speed Variation',
    description: 'Varying your speaking speed is crucial for keeping listeners engaged. Slow down for important, complex points to convey gravity and allow for comprehension. Speed up when telling a story or building excitement. This variation adds a dynamic layer to your delivery.',
    audioSamples: [
      {
        title: 'Slowing Down for Emphasis',
        text: 'This... is the single... most important... thing... you will learn today.'
      },
      {
        title: 'Speeding Up for Excitement',
        text: 'Then all of a sudden everything changed in an instant and we saw results like we\'d never seen before!'
      }
    ]
  },
  {
    day: 4,
    title: 'Emphasis & Word Stretching',
    description: 'Emphasis is about making certain words stand out to convey meaning. You can do this by saying a word louder, at a higher pitch, or by stretching it out slightly. This tells your audience "Pay attention to this word!"',
    audioSamples: [
      {
        title: 'Example: Emphasizing different words',
        text: 'I did not say you stole the money.'
      },
      {
        title: 'Example: Word Stretching for Impact',
        text: 'This is a huuuuge opportunity.'
      }
    ]
  },
  {
    day: 5,
    title: 'Tone & Vocal Energy',
    description: 'Your tone of voice conveys the emotion behind your words. Are you excited? Serious? Empathetic? Your vocal energy should match your message. A mismatch can confuse your audience, but alignment builds trust and connection.',
    audioSamples: [
      {
        title: 'Serious Tone',
        text: 'This is a serious issue that requires our immediate attention.'
      },
      {
        title: 'Excited Tone',
        text: 'This is a fantastic issue that requires our immediate attention!'
      }
    ]
  },
  {
    day: 6,
    title: 'Using Hooks with Cadence',
    description: 'You have three seconds to grab attention. A powerful hook combined with compelling cadence is the key. Start with a bold statement, an intriguing question, or a surprising fact, and deliver it with a cadence that makes people stop and listen.',
    audioSamples: [
      {
        title: 'Example Hook Delivery',
        text: 'Let\'s be real... Posting randomly on social media... is a complete waste of your time.'
      }
    ]
  },
  {
    day: 7,
    title: 'Full Practice & Feedback',
    description: 'Time to put it all together. Use the practice scripts below or your own material. Record yourself using the microphone button below and listen to the playback. Pay attention to your pauses, speed, and emphasis. The best way to improve is to practice consistently.',
    practiceScript: {
      title: 'Practice Script: The Sales Funnel',
      script: '“Listen… [pause] Most businesses are posting on social media, [pause] hoping for sales. [pause] But hope is not a strategy. [pause] If you want to GROW, [pause] you need a SALES FUNNEL. A system that ATTRACTS leads, [pause] NURTURES them, [pause] and CONVERTS them into paying clients. At Boye Digital, we build these funnels for you, [pause] so you can focus on serving, [pause] not stressing about where your next client will come from.”'
    }
  },
  {
    day: 8,
    title: 'Business Motivation Practice',
    description: 'Apply all the techniques you\'ve learned to an inspirational script. Focus on conveying passion and conviction through your voice. Use pauses for dramatic effect and vary your tone to match the motivational message. This is your final test!',
    practiceScript: {
      title: 'Practice Script: The Myth of Overnight Success',
      script: '“Everyone wants the secret to ‘overnight success.’ [pause] But the truth is… it’s a MYTH. [pause] Success isn’t a lottery ticket. It’s a PROCESS. [pause] It’s about SHOWING UP when you don’t feel like it. [pause] It’s about pushing through the resistance, day after day. The real secret? [pause] Unrelenting consistency. Show up every single day, do the work, and let the results speak for themselves. That’s how you build something that lasts.”'
    }
  }
];
