// blackchalk 0.3.0 leaves three forwardRef factories and their displayName
// assignments unannotated. They retain unused controls and Motion even behind
// narrow entry points. Keep each allocation and its metadata in one pure unit;
// used components still execute exactly the original code.
export default function blackchalkTreeshake() {
  return {
    name: 'blackchalk-pure-factories',
    enforce: 'pre',
    transform(code, id) {
      if (!/\/blackchalk\/dist\/index\.js$/.test(id)) return;
      for (const name of ['SketchTab', 'SketchIconRadio', 'SketchDayCell']) {
        const start = `var ${name} = forwardRef(`;
        const end = `${name}.displayName = "${name}";`;
        if (!code.includes(start) || !code.includes(end)) throw new Error(`Recheck BlackChalk purity annotations: ${name} changed`);
        code = code.replace(start, `var ${name} = /* @__PURE__ */ (() => { var ${name} = forwardRef(`)
          .replace(end, `${end} return ${name}; })();`);
      }
      code = code.replace('var FrameContainerContext = createContext(null);', 'var FrameContainerContext = /* @__PURE__ */ createContext(null);');
      return { code, map: null };
    },
  };
}
