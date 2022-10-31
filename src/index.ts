const BLOCK_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

export type BlockNumber = typeof BLOCK_NUMBERS[number];

export type Item =
  | { type: "image"; url: string }
  | { type: "text"; text: string };

export type Results = Record<
  BlockNumber,
  { completionTimeMs: number; correct: boolean }[]
>;

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
  | { testComplete: true; results: Results };

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
  const initialTargetOrder = (
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
          left: { target: initialTargetOrder[0] },
          right: { target: initialTargetOrder[1] },
          correctChoice,
          item: randomFromArray(
            correctChoice === "left"
              ? targets[initialTargetOrder[0]]
              : targets[initialTargetOrder[1]]
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
            target: initialTargetOrder[0],
          },
          right: {
            category: initialCategoryOrder[1],
            target: initialTargetOrder[1],
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
                  ? targets[initialTargetOrder[0]]
                  : targets[initialTargetOrder[1]]
              ),
        };
      case 5:
        return {
          left: { target: initialTargetOrder[1] },
          right: { target: initialTargetOrder[0] },
          correctChoice,
          item: randomFromArray(
            correctChoice === "left"
              ? targets[initialTargetOrder[1]]
              : targets[initialTargetOrder[0]]
          ),
        };
      case 6:
      case 7:
        return {
          left: {
            category: initialCategoryOrder[1],
            target: initialTargetOrder[1],
          },
          right: {
            category: initialCategoryOrder[0],
            target: initialTargetOrder[0],
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
                  ? targets[initialTargetOrder[1]]
                  : targets[initialTargetOrder[0]]
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
        results: Object.fromEntries(
          BLOCK_NUMBERS.map<
            [
              blockNumber: BlockNumber,
              results: { completionTimeMs: number; correct: boolean }[]
            ]
          >((blockNumber) => {
            const trialsBefore = Object.entries(trialsPerBlock)
              .filter(([block]) => Number(block) < blockNumber)
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              .reduce((total, [_, numTrials]) => total + numTrials, 0);
            return [
              blockNumber,
              results.slice(
                trialsBefore,
                trialsBefore + trialsPerBlock[blockNumber]
              ),
            ];
          })
        ) as Results,
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

function randomChoice(): boolean {
  return Math.floor(Math.random() * 2) == 0;
}

function randomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
