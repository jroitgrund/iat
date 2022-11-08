import sum from "lodash/sum";

export const BLOCK_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

export type BlockNumber = typeof BLOCK_NUMBERS[number];

export type Item =
  | { type: "image"; url: string }
  | { type: "text"; text: string };

export type RawResults<CategoryT, TargetT> = {
  blocks: Record<BlockNumber, { completionTimeMs: number; correct: boolean }[]>;
  positiveScoreAssociations: [
    { target: TargetT; category: CategoryT },
    { target: TargetT; category: CategoryT }
  ];
  negativeScoreAssociations: [
    { target: TargetT; category: CategoryT },
    { target: TargetT; category: CategoryT }
  ];
};

export type Results<CategoryT, TargetT> =
  | {
      type: "invalid";
      reason:
        | "no-low-latency-trials"
        | "too-many-high-latency-trials"
        | "no-correct-answers";
    }
  | {
      type: "valid";
      d: number;
      association: [
        { target: TargetT; category: CategoryT },
        { target: TargetT; category: CategoryT }
      ];
    };

export type Choice = "left" | "right";

export type TrialOption<CategoryT, TargetT> = {
  category?: CategoryT;
  target?: TargetT;
};

export type IATStage<CategoryT, TargetT> =
  | {
      testComplete: false;
      block: number;
      trial: number;
      left: TrialOption<CategoryT, TargetT>;
      right: TrialOption<CategoryT, TargetT>;
      item: Item;
      correctChoice: Choice;
      next: (
        completionTimeMs: number,
        correct: boolean
      ) => IATStage<CategoryT, TargetT>;
    }
  | { testComplete: true; rawResults: RawResults<CategoryT, TargetT> };

export function IAT<CategoryT extends string, TargetT extends string>(options: {
  categories: Record<CategoryT, Item[]>;
  targets: Record<TargetT, Item[]>;
  trialsPerBlock: Record<BlockNumber, number>;
}): IATStage<CategoryT, TargetT> {
  const { categories, targets, trialsPerBlock } = options;
  if (
    Object.keys(categories).length !== 2 ||
    Object.keys(targets).length !== 2
  ) {
    throw new Error("There must be two categories and two targets");
  }

  if (Object.values(trialsPerBlock).some((trials) => trials < 1)) {
    throw new Error("Each block must have at least 1 trial");
  }

  let block: BlockNumber = 1;
  let trial = 1;
  let testComplete = false;
  const results: { completionTimeMs: number; correct: boolean }[] = [];
  const [target1, target2] = Object.keys(targets) as [TargetT, TargetT];
  const [category1, category2] = Object.keys(categories) as [
    CategoryT,
    CategoryT
  ];
  const targetOrder = (
    randomChoice() ? [target1, target2] : [target2, target1]
  ) as [TargetT, TargetT];
  const initialCategoryOrder = (
    randomChoice() ? [category1, category2] : [category2, category1]
  ) as [CategoryT, CategoryT];

  function getTrial(): {
    item: Item;
    correctChoice: Choice;
    left: TrialOption<CategoryT, TargetT>;
    right: TrialOption<CategoryT, TargetT>;
  } {
    const correctChoice: Choice = randomChoice() ? "left" : "right";
    switch (block) {
      case 1:
        return {
          left: { target: targetOrder[0] },
          right: { target: targetOrder[1] },
          correctChoice,
          item: randomFromArray(
            correctChoice === "left"
              ? targets[targetOrder[0]]
              : targets[targetOrder[1]]
          ),
        };
      case 2:
        return {
          left: { category: initialCategoryOrder[0] },
          right: { category: initialCategoryOrder[1] },
          correctChoice,
          item: randomFromArray(
            correctChoice === "left"
              ? categories[initialCategoryOrder[0]]
              : categories[initialCategoryOrder[1]]
          ),
        };
      case 3:
      case 4:
        return {
          left: {
            category: initialCategoryOrder[0],
            target: targetOrder[0],
          },
          right: {
            category: initialCategoryOrder[1],
            target: targetOrder[1],
          },
          correctChoice,
          item: randomChoice()
            ? randomFromArray(
                correctChoice === "left"
                  ? categories[initialCategoryOrder[0]]
                  : categories[initialCategoryOrder[1]]
              )
            : randomFromArray(
                correctChoice === "left"
                  ? targets[targetOrder[0]]
                  : targets[targetOrder[1]]
              ),
        };
      case 5:
        return {
          left: { category: initialCategoryOrder[1] },
          right: { category: initialCategoryOrder[0] },
          correctChoice,
          item: randomFromArray(
            correctChoice === "left"
              ? categories[initialCategoryOrder[1]]
              : categories[initialCategoryOrder[0]]
          ),
        };
      case 6:
      case 7:
        return {
          left: {
            category: initialCategoryOrder[1],
            target: targetOrder[0],
          },
          right: {
            category: initialCategoryOrder[0],
            target: targetOrder[1],
          },
          correctChoice,
          item: randomChoice()
            ? randomFromArray(
                correctChoice === "left"
                  ? categories[initialCategoryOrder[1]]
                  : categories[initialCategoryOrder[0]]
              )
            : randomFromArray(
                correctChoice === "left"
                  ? targets[targetOrder[0]]
                  : targets[targetOrder[1]]
              ),
        };
    }
  }

  function next(
    completionTimeMs: number,
    correct: boolean
  ): IATStage<CategoryT, TargetT> {
    results.push({ completionTimeMs, correct });

    if (trialsPerBlock[block] === trial) {
      if (block === 7) {
        testComplete = true;
      } else {
        block++;
        trial = 1;
      }
    } else {
      trial++;
    }

    return result();
  }

  function result(): IATStage<CategoryT, TargetT> {
    if (testComplete) {
      return {
        testComplete: true,
        rawResults: {
          blocks: Object.fromEntries(
            BLOCK_NUMBERS.map<
              [
                blockNumber: BlockNumber,
                results: { completionTimeMs: number; correct: boolean }[]
              ]
            >((blockNumber) => {
              const trialsBefore = Object.entries(trialsPerBlock)
                .filter(([block]) => Number(block) < blockNumber)
                .reduce((total, [_, numTrials]) => total + numTrials, 0);
              return [
                blockNumber,
                results.slice(
                  trialsBefore,
                  trialsBefore + trialsPerBlock[blockNumber]
                ),
              ];
            })
          ),
          positiveScoreAssociations: [
            { target: targetOrder[0], category: initialCategoryOrder[0] },
            { target: targetOrder[1], category: initialCategoryOrder[1] },
          ],
          negativeScoreAssociations: [
            { target: targetOrder[0], category: initialCategoryOrder[1] },
            { target: targetOrder[1], category: initialCategoryOrder[0] },
          ],
        } as RawResults<CategoryT, TargetT>,
      };
    }

    const { left, right, item, correctChoice } = getTrial();
    return {
      testComplete: false,
      block,
      trial,
      left,
      right,
      correctChoice,
      item,
      next,
    };
  }

  return result();
}

export function getResults<CategoryT, TargetT>(
  rawResults: RawResults<CategoryT, TargetT>
): Results<CategoryT, TargetT> {
  const blocks = Object.entries(rawResults.blocks).map(
    ([_blockNumber, trials]) =>
      trials.filter(({ completionTimeMs }) => completionTimeMs < 10_000)
  );

  if (blocks.some((block) => block.length === 0)) {
    return { type: "invalid", reason: "no-low-latency-trials" };
  }

  const numTrials = sum(blocks.map((block) => block.length));
  const numTrialsUnder300Ms = sum(
    blocks.map(
      (block) =>
        block.filter(({ completionTimeMs }) => completionTimeMs < 300).length
    )
  );

  if (numTrialsUnder300Ms / numTrials > 0.1) {
    return { type: "invalid", reason: "too-many-high-latency-trials" };
  }

  const means = blocks.map((block) =>
    getMean(
      block
        .filter(({ correct }) => correct)
        .map(({ completionTimeMs }) => completionTimeMs)
    )
  );

  const standardDeviationB3andB6 = getStandardDeviation(
    [blocks[2], blocks[5]].flatMap((block) =>
      block.map(({ completionTimeMs }) => completionTimeMs)
    )
  );

  const standardDeviationB4andB7 = getStandardDeviation(
    [blocks[3], blocks[6]].flatMap((block) =>
      block.map(({ completionTimeMs }) => completionTimeMs)
    )
  );

  const meansWithErrorsReplaced = blocks.map((block, i) =>
    getMean(
      block.map(({ correct, completionTimeMs }) =>
        correct ? completionTimeMs : means[i] + 600
      )
    )
  );

  const d = getMean([
    (meansWithErrorsReplaced[5] - meansWithErrorsReplaced[2]) /
      standardDeviationB3andB6,
    (meansWithErrorsReplaced[6] - meansWithErrorsReplaced[3]) /
      standardDeviationB4andB7,
  ]);

  if (isNaN(d)) {
    return { type: "invalid", reason: "no-correct-answers" };
  }

  return {
    type: "valid",
    d: Math.abs(d),
    association:
      d >= 0
        ? rawResults.positiveScoreAssociations
        : rawResults.negativeScoreAssociations,
  };
}

function randomChoice(): boolean {
  return Math.floor(Math.random() * 2) == 0;
}

function randomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getStandardDeviation(numbers: number[]): number {
  const mean = getMean(numbers);
  return Math.sqrt(sum(numbers.map((n) => (n - mean) ** 2)) / numbers.length);
}

function getMean(numbers: number[]): number {
  return sum(numbers) / numbers.length;
}
