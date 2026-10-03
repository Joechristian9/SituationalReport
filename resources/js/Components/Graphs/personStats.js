// Shared helpers for the Casualties / Injured / Missing graphs and their filters.

export const AGE_BRACKETS = ["0-17", "18-30", "31-50", "51-65", "66+"];

export const ageBracket = (rawAge) => {
    const age = parseInt(rawAge, 10);
    if (Number.isNaN(age)) return null;
    if (age <= 17) return "0-17";
    if (age <= 30) return "18-30";
    if (age <= 50) return "31-50";
    if (age <= 65) return "51-65";
    return "66+";
};

export const sexOf = (item) => {
    const sex = item.sex?.toLowerCase();
    if (sex === "male") return "Male";
    if (sex === "female") return "Female";
    return "Unknown";
};

export const matchesFilters = (item, { sex = "all", age = "all" } = {}) => {
    if (sex !== "all" && sexOf(item) !== sex) return false;
    if (age !== "all" && ageBracket(item.age) !== age) return false;
    return true;
};
