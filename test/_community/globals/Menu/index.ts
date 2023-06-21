import { GlobalConfig } from "../../../../src/globals/config/types";

export const menuSlug = "menu";

export const MenuGlobal: GlobalConfig = {
  slug: menuSlug,
  fields: [
    {
      name: "globalText",
      type: "text",
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Page",
          fields: [
            {
              type: "tabs",
              admin: {
                condition: (data) => {
                  console.log("loop");
                  return data.globalText === "abc";
                },
              },
              tabs: [
                {
                  label: "Tab",
                  fields: [
                    {
                      name: "conditionalField",
                      label: "Conditional Field",
                      type: "text",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
