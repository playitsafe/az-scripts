import {
  arrayOf,
  optional,
  shapeOf,
  validationTypes,
} from "typescript-object-validator";

export const eventAuthorPresentationShape = shapeOf({
  value: validationTypes.string,
  origin: validationTypes.string,
  avatar: validationTypes.string,
});

export const eventEntryPresentationShape = shapeOf({
  author: eventAuthorPresentationShape,
  creator: eventAuthorPresentationShape,
  creationDate: validationTypes.string,
  eTag: validationTypes.string,
  lastModifiedDate: validationTypes.string,
  values: {
    title: optional(validationTypes.string),
    body: optional(validationTypes.string),
    happening: optional(validationTypes.string),
    milestone: optional(validationTypes.boolean),
  },
  event: validationTypes.string,
  model: validationTypes.string,
  publishDate: optional(validationTypes.string),
  self: validationTypes.string,
  state: validationTypes.string,
  tags: arrayOf({
    id: validationTypes.string,
    label: validationTypes.string,
    value: validationTypes.string,
    origin: validationTypes.string,
  }),
  sticky: validationTypes.boolean,
  editable: validationTypes.boolean,
  deletable: validationTypes.boolean,
});

export const eventEntriesPresentationShape = shapeOf({
  entries: arrayOf(eventEntryPresentationShape),
  self: validationTypes.string,
  previous: validationTypes.string,
  next: optional(validationTypes.string),
});
