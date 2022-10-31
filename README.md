Docs: https://jroitgrund.github.io/iat

```
npm install implicit-association-test
```

```typescript
import { IAT, Item } from "implicit-association-test";

type TargetT = "insects" | "flowers";
type CategoryT = "pleasant" | "unpleasant";

const targets: Record<TargetT, Item[]> = {
  insects: [
    { type: "text", text: "wasp" },
    { type: "text", text: "bee" },
    { type: "text", text: "ant" },
  ],
  flowers: [
    { type: "text", text: "rose" },
    { type: "text", text: "tulip" },
    { type: "text", text: "daffodil" },
  ],
};

const categories: Record<CategoryT, Item[]> = {
  pleasant: [
    { type: "text", text: "nice" },
    { type: "text", text: "soft" },
    { type: "text", text: "lush" },
  ],
  unpleasant: [
    { type: "text", text: "horrible" },
    { type: "text", text: "repulsive" },
    { type: "text", text: "scary" },
  ],
};

const iatStage = IAT({
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

while (!iatStage.testComplete) {
  iatStage.block; // 1-7;
  iatStage.trial; // 1-n, configured in options;
  iatStage.item; // item to display, image or text
  iatStage.left; // category and / or target to display on the left
  iatStage.right; // category and / or target to display on the right
  iatStage.correctChoice; // "left" or "right": the correct item assignment

  iatStage = iatStage.next(completionTimeMs, didUserMakeCorrectChoice);
}

iatStage.results;
```
