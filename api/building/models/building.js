'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */



 const getRoomItems = async (building) => {
  let itemIds = await strapi.connections.default.raw(
     `SELECT * FROM rooms_items__items_rooms WHERE room_id in (${roomIds.join()})`
   );

   itemIds = JSON.stringify(itemIds.rows);
   itemIds = JSON.parse(itemIds).map((a) => a.item_id);

   const items = await strapi
     .query("item")
     .model.query((qb) => {
       qb.where("id", "in", itemIds);
     })
     .fetchAll({
       withRelated: [
         {
           rooms: (qb) => {
             qb.where("building_id", "=", building.id);
           },
         },
       ],
     });

   return items.toJSON();
}

function slugify(string) {
  return string
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
module.exports = {
  lifecycles: {
    beforeCreate: async (data) => {
      if (data.title) {
        data.slug = slugify(data.title);
      }
    },
    beforeUpdate: async (params, data) => {
      if (data.title) {
        data.slug = slugify(data.title);
      }
    },
  },

  find: async (ctx) => {
    const { slug } = ctx.query;

    const items = await strapi
      .query("building")
      .find(ctx.query, ["rooms.items", "quote.person"]);

    if (slug && items[0]) {
      items[0].items = await getRoomItems(items[0]);
    }

    return items;
  },
  findOne: async (ctx) => {
    const building = await strapi
      .query("building")
      .findOne({ id: ctx.params.id }, ["rooms.items"]);

    building.items = await getRoomItems(building);

    return building;
  },
};