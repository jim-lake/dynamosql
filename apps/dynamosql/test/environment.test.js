before(() => {
  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
  if (!region) {
    console.error('region must be set with AWS_REGION or AWS_DEFAULT_REGION');
    process.exit(-1);
  }
});
