/** «Ropa de cama» -> «ropa-de-cama»: sin tildes, en minúsculas y apto para una dirección. */
export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
