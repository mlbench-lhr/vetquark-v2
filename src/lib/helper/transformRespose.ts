interface BestMatch {
  best_box_label: string;
  roi: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  };
}

interface TestBox {
  best_match: BestMatch;
  test_box_label: string;
  test_box_roi: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  };
}

interface Result {
  test_boxes: TestBox[];
  time: string;
}

interface InputData {
  results: Result[];
  success: boolean;
}

export function transformTestBoxes(data: InputData): Record<number, number> {
  const output: Record<number, number> = {};
  
  data.results.forEach(result => {
    result.test_boxes.forEach(testBox => {
      // Extract number from test_box_label (e.g., "T15" -> 15)
      const testNum = parseInt(testBox.test_box_label.replace('T', ''));
      
      // Extract last digit from best_box_label (e.g., "R153" -> 3)
      const bestBoxLabel = testBox.best_match.best_box_label;
      const lastDigit = parseInt(bestBoxLabel.slice(-1));
      
      output[testNum] = lastDigit;
    });
  });
  
  // Sort by keys
  return Object.keys(output)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .reduce((acc, key) => {
      acc[parseInt(key)] = output[parseInt(key)];
      return acc;
    }, {} as Record<number, number>);
}

