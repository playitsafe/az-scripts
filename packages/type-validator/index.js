import { validateObjectShape } from "typescript-object-validator";
import { eventEntriesPresentationShape } from "./helper.js";

const resBody = {
  next: "https://test-cue.wanews.com.au/live-center-presentation-webservice/changelog/event/12961519/before/23542769?count=2",
  previous:
    "https://test-cue.wanews.com.au/live-center-presentation-webservice/changelog/event/12961519/after/23542770?count=2",
  self: "https://test-cue.wanews.com.au/live-center-presentation-webservice/changelog/event/12961519/before/0?count=2",
  entries: [
    {
      author: {
        value: "Aaron Zhang",
        origin:
          "https://test-cue.wanews.com.au/live-center-presentation-webservice/person/854",
        avatar:
          "https://test-cue.wanews.com.au/live-center-presentation-webservice/person/854/avatar",
      },
      creator: {
        value: "Aaron Zhang",
        origin:
          "https://test-cue.wanews.com.au/live-center-presentation-webservice/person/854",
        avatar:
          "https://test-cue.wanews.com.au/live-center-presentation-webservice/person/854/avatar",
      },
      creationDate: "2025-07-08T06:29:31.000+0000",
      eTag: "0edc3360-d4ac-4201-9493-483b5b9579d6",
      lastModifiedDate: "2025-07-08T06:29:31.000+0000",
      payload: [
        {
          name: "title",
          value: "Event 21",
        },
        {
          name: "body",
          value: "<p>21 21 b21</p>",
        },
      ],
      publishDate: "2025-07-08T06:29:31.000+0000",
      self: "https://test-cue.wanews.com.au/live-center-presentation-webservice/entry/20114",
      state: "published",
      tags: [],
      sticky: false,
    },
    {
      author: {
        value: "Aaron Zhang",
        origin:
          "https://test-cue.wanews.com.au/live-center-presentation-webservice/person/854",
        avatar:
          "https://test-cue.wanews.com.au/live-center-presentation-webservice/person/854/avatar",
      },
      creator: {
        value: "Aaron Zhang",
        origin:
          "https://test-cue.wanews.com.au/live-center-presentation-webservice/person/854",
        avatar:
          "https://test-cue.wanews.com.au/live-center-presentation-webservice/person/854/avatar",
      },
      creationDate: "2025-07-08T06:29:17.000+0000",
      eTag: "2685a5a0-1fe9-4f46-b32d-b59f8cb4a9e9",
      lastModifiedDate: "2025-07-08T06:29:17.000+0000",
      payload: [
        {
          name: "title",
          value: "Event 20",
        },
        {
          name: "body",
          value: "<p>20 20</p>",
        },
      ],
      publishDate: "2025-07-08T06:29:17.000+0000",
      self: "https://test-cue.wanews.com.au/live-center-presentation-webservice/entry/20113",
      state: "published",
      tags: [],
      sticky: false,
    },
  ],
};

const resBodyEditorial = {
  //   next: "https://test-cue.wanews.com.au/live-center-editorial/changelog/event/12961519/before/23644659?count=2",
  previous:
    "https://test-cue.wanews.com.au/live-center-editorial/changelog/event/12961519/after/23644660?count=2",
  self: "https://test-cue.wanews.com.au/live-center-editorial/changelog/event/12961519/before/23644661?count=2",
  entries: [
    {
      author: {
        value: "Seth Matthews",
        origin:
          "https://test-cue.wanews.com.au/live-center-editorial/person/1211",
        avatar:
          "https://test-cue.wanews.com.au/live-center-editorial/person/1211/avatar",
      },
      creator: {
        value: "Aaron Zhang",
        origin:
          "https://test-cue.wanews.com.au/live-center-editorial/person/854",
        avatar:
          "https://test-cue.wanews.com.au/live-center-editorial/person/854/avatar",
      },
      creationDate: "2025-07-18T12:16:31.000+0000",
      eTag: "75cc4055-aeed-49d6-86fa-c19a51011aab",
      event:
        "https://test-cue.wanews.com.au/live-center-editorial/event/12961519",
      lastModifiedDate: "2025-07-18T12:16:31.000+0000",
      model:
        "https://test-cue.wanews.com.au/live-center-editorial/model/12961519/election",
      values: {
        title: "Event 26",
        body: "<p>happenning</p><h2>aaa h1</h2>",
        happening: "prediction",
      },
      publishDate: "2025-07-18T12:16:31.000+0000",
      self: "https://test-cue.wanews.com.au/live-center-editorial/entry/20130",
      state: "published",
      tags: [],
      sticky: false,
      editable: true,
      deletable: true,
    },
    {
      author: {
        value: "Aaron Zhang",
        origin:
          "https://test-cue.wanews.com.au/live-center-editorial/person/854",
        avatar:
          "https://test-cue.wanews.com.au/live-center-editorial/person/854/avatar",
      },
      creator: {
        value: "Aaron Zhang",
        origin:
          "https://test-cue.wanews.com.au/live-center-editorial/person/854",
        avatar:
          "https://test-cue.wanews.com.au/live-center-editorial/person/854/avatar",
      },
      creationDate: "2025-07-18T12:13:34.000+0000",
      eTag: "4dca134b-de69-484c-837a-9075cf78fe30",
      event:
        "https://test-cue.wanews.com.au/live-center-editorial/event/12961519",
      lastModifiedDate: "2025-07-18T12:13:34.000+0000",
      model:
        "https://test-cue.wanews.com.au/live-center-editorial/model/12961519/election",
      values: {
        title: "Event 25",
        body: "<p>happenning new?</p>",
        milestone: true,
        happening: "prediction",
      },
      publishDate: "2025-07-18T12:13:34.000+0000",
      self: "https://test-cue.wanews.com.au/live-center-editorial/entry/20129",
      state: "published",
      tags: [],
      sticky: true,
      editable: true,
      deletable: true,
    },
  ],
};

const parsedEntries = validateObjectShape(
  "Event Entries",
  //   resBody,
  resBodyEditorial,
  eventEntriesPresentationShape,
  { coerceValidObjectIntoArray: true }
);

console.log(parsedEntries);
