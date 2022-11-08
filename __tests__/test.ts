import { BlockNumber, getResults, IAT, Item, Results } from "../src/index";

type TargetT = "women" | "men";
type CategoryT = "good" | "bad";

describe("IAT", () => {
  it("returns correct results for this bad example", () => {
    const results = getResults({
      blocks: {
        "1": [
          { completionTimeMs: 1368, correct: false },
          { completionTimeMs: 776, correct: false },
          { completionTimeMs: 591, correct: false },
        ],
        "2": [
          { completionTimeMs: 1208, correct: false },
          { completionTimeMs: 1223, correct: false },
          { completionTimeMs: 751, correct: false },
        ],
        "3": [
          { completionTimeMs: 1216, correct: false },
          { completionTimeMs: 1464, correct: false },
          { completionTimeMs: 807, correct: false },
        ],
        "4": [
          { completionTimeMs: 3696, correct: false },
          { completionTimeMs: 784, correct: false },
          { completionTimeMs: 1552, correct: false },
        ],
        "5": [
          { completionTimeMs: 2640, correct: false },
          { completionTimeMs: 1519, correct: false },
          { completionTimeMs: 919, correct: false },
        ],
        "6": [
          { completionTimeMs: 1736, correct: false },
          { completionTimeMs: 849, correct: false },
          { completionTimeMs: 951, correct: false },
        ],
        "7": [
          { completionTimeMs: 1176, correct: false },
          { completionTimeMs: 928, correct: false },
          { completionTimeMs: 944, correct: false },
        ],
      },
      positiveScoreAssociations: [
        { target: "Flowers", category: "Unpleasant" },
        { target: "Insects", category: "Pleasant" },
      ],
      negativeScoreAssociations: [
        { target: "Flowers", category: "Pleasant" },
        { target: "Insects", category: "Unpleasant" },
      ],
    });
    expect(results.type).toEqual("invalid");
  });
  it("returns the raw results and scores them", () => {
    const targets: Record<TargetT, Item[]> = {
      women: [
        { type: "text", text: "agnes" },
        { type: "text", text: "miranda" },
        { type: "text", text: "lisa" },
      ],
      men: [
        { type: "text", text: "john" },
        { type: "text", text: "paul" },
        { type: "text", text: "david" },
      ],
    };

    const categories: Record<CategoryT, Item[]> = {
      good: [
        { type: "text", text: "awesome" },
        { type: "text", text: "super" },
        { type: "text", text: "cool" },
      ],
      bad: [
        { type: "text", text: "sucks" },
        { type: "text", text: "bad" },
        { type: "text", text: "hate" },
      ],
    };

    let iatStage = IAT({
      categories,
      targets,
      trialsPerBlock: {
        1: 3,
        2: 3,
        3: 3,
        4: 3,
        5: 3,
        6: 3,
        7: 3,
      },
    });

    let trials = 0;

    let categoryLeftInitial: CategoryT | undefined = undefined;
    let categoryRightInitial: CategoryT | undefined = undefined;
    let targetRight: TargetT | undefined = undefined;
    let targetLeft: TargetT | undefined = undefined;

    while (!iatStage.testComplete) {
      const itemText = getItemText(iatStage.item);

      if (
        itemText === "agnes" ||
        itemText === "miranda" ||
        itemText === "lisa"
      ) {
        expect(iatStage.correctChoice).toEqual(
          iatStage.left.target === "women" ? "left" : "right"
        );
      } else if (
        itemText === "john" ||
        itemText === "paul" ||
        itemText === "david"
      ) {
        expect(iatStage.correctChoice).toEqual(
          iatStage.left.target === "men" ? "left" : "right"
        );
      } else if (
        itemText === "awesome" ||
        itemText === "super" ||
        itemText === "cool"
      ) {
        expect(iatStage.correctChoice).toEqual(
          iatStage.left.category === "good" ? "left" : "right"
        );
      } else if (
        itemText === "sucks" ||
        itemText === "bad" ||
        itemText === "hate"
      ) {
        expect(iatStage.correctChoice).toEqual(
          iatStage.left.category === "bad" ? "left" : "right"
        );
      } else {
        throw new Error();
      }

      expect(iatStage.trial).toBeGreaterThanOrEqual(1);
      expect(iatStage.trial).toBeLessThanOrEqual(3);

      if (iatStage.block === 1) {
        if (targetLeft == null || targetRight == null) {
          targetLeft = checkNotNull(iatStage.left.target);
          targetRight = checkNotNull(iatStage.right.target);
        } else {
          expect(iatStage.left.target).toEqual(targetLeft);
          expect(iatStage.right.target).toEqual(targetRight);
        }
      } else if (iatStage.block === 2) {
        if (categoryLeftInitial == null || categoryRightInitial == null) {
          categoryLeftInitial = checkNotNull(iatStage.left.category);
          categoryRightInitial = checkNotNull(iatStage.right.category);
        } else {
          expect(iatStage.left.category).toEqual(categoryLeftInitial);
          expect(iatStage.right.category).toEqual(categoryRightInitial);
        }
      } else if (iatStage.block === 3 || iatStage.block === 4) {
        expect(iatStage.left.target).toEqual(targetLeft);
        expect(iatStage.right.target).toEqual(targetRight);
        expect(iatStage.left.category).toEqual(categoryLeftInitial);
        expect(iatStage.right.category).toEqual(categoryRightInitial);
      } else if (iatStage.block === 5) {
        expect(iatStage.left.category).toEqual(categoryRightInitial);
        expect(iatStage.right.category).toEqual(categoryLeftInitial);
      } else if (iatStage.block === 6 || iatStage.block === 7) {
        expect(iatStage.left.target).toEqual(targetLeft);
        expect(iatStage.right.target).toEqual(targetRight);
        expect(iatStage.left.category).toEqual(categoryRightInitial);
        expect(iatStage.right.category).toEqual(categoryLeftInitial);
      }

      iatStage = iatStage.next(
        iatStage.block == 6 || iatStage.block == 7 ? 400 : 350,
        true
      );
      trials++;
    }

    const rawResults = iatStage.rawResults;
    [1, 2, 3, 4, 5, 6, 7].forEach((block) =>
      expect(rawResults.blocks[block as BlockNumber]).toHaveLength(3)
    );
    expect(trials).toEqual(21);
    expect(rawResults.positiveScoreAssociations).toEqual(
      expect.arrayContaining([
        { category: categoryLeftInitial, target: targetLeft },
        { category: categoryRightInitial, target: targetRight },
      ])
    );
    expect(rawResults.negativeScoreAssociations).toEqual(
      expect.arrayContaining([
        { category: categoryRightInitial, target: targetLeft },
        { category: categoryLeftInitial, target: targetRight },
      ])
    );

    const results = getValidResults(getResults(rawResults));

    expect(results.association).toEqual(
      expect.arrayContaining([
        { category: categoryLeftInitial, target: targetLeft },
        { category: categoryRightInitial, target: targetRight },
      ])
    );
    expect(results.d).toEqual(2);
  });
});

function getItemText(item: Item) {
  if (item.type === "image") {
    throw new Error();
  }

  return item.text;
}

function getValidResults<T, U>(results: Results<T, U>) {
  if (results.type === "invalid") {
    throw new Error();
  }

  return results;
}

function checkNotNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error();
  }

  return value;
}
