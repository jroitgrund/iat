import { BlockNumber, IAT, IATStage, Item } from "../src/index";

type TargetT = "women" | "men";
type CategoryT = "good" | "bad";

describe("test", () => {
  it("works", () => {
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
    let targetRightInitial: TargetT | undefined = undefined;
    let targetLeftInitial: TargetT | undefined = undefined;

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
        if (targetLeftInitial == null || targetRightInitial == null) {
          targetLeftInitial = checkNotNull(iatStage.left.target);
          targetRightInitial = checkNotNull(iatStage.right.target);
        } else {
          expect(iatStage.left.target).toEqual(targetLeftInitial);
          expect(iatStage.right.target).toEqual(targetRightInitial);
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
        expect(iatStage.left.target).toEqual(targetLeftInitial);
        expect(iatStage.right.target).toEqual(targetRightInitial);
        expect(iatStage.left.category).toEqual(categoryLeftInitial);
        expect(iatStage.right.category).toEqual(categoryRightInitial);
      } else if (iatStage.block === 5) {
        expect(iatStage.left.target).toEqual(targetRightInitial);
        expect(iatStage.right.target).toEqual(targetLeftInitial);
      } else if (iatStage.block === 6 || iatStage.block === 7) {
        expect(iatStage.left.target).toEqual(targetRightInitial);
        expect(iatStage.right.target).toEqual(targetLeftInitial);
        expect(iatStage.left.category).toEqual(categoryRightInitial);
        expect(iatStage.right.category).toEqual(categoryLeftInitial);
      }

      iatStage = iatStage.next(100, true);
      trials++;
    }

    const results = getTestResults(iatStage);
    [1, 2, 3, 4, 5, 6, 7].forEach((block) =>
      expect(results[block as BlockNumber]).toHaveLength(3)
    );
    expect(trials).toEqual(21);
  });
});

function getItemText(item: Item) {
  if (item.type === "image") {
    throw new Error();
  }

  return item.text;
}

function getTestResults<T, U>(iatStage: IATStage<T, U>) {
  if (!iatStage.testComplete) {
    throw new Error();
  }

  return iatStage.results;
}

function checkNotNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error();
  }

  return value;
}
