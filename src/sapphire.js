    // var pointLight1 = new THREE.Mesh(
    //   new THREE.SphereBufferGeometry(1, 8, 8),
    //   new THREE.MeshBasicMaterial({ color: 0x1df7d6 }),
    // );
    // pointLight1.add(new THREE.PointLight(0x1df7d6, 7.0, 300));
    // pointLight1.position.set(aishaInnerRadiusMM, 10, 5);
    // scene.add(pointLight1);

    const shader = new THREE.TranslucentShader();
    const uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    const loader = new THREE.TextureLoader();
    const imgTexture = loader.load(require("../white.jpg"));
    const thicknessTexture = loader.load(require("../bunny_thickness.png"));
    imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
    uniforms["map"].value = imgTexture;
    uniforms["diffuse"].value = new THREE.Color(0x1df7d6);
    uniforms["shininess"].value = 5;
    uniforms["opacity"].value = 0.5;
    uniforms["thicknessMap"].value = thicknessTexture;
    uniforms["thicknessColor"].value = new THREE.Color(0xff3333);
    uniforms["thicknessDistortion"].value = 0.1;
    uniforms["thicknessAmbient"].value = 0.1;
    uniforms["thicknessAttenuation"].value = 0.8;
    uniforms["thicknessPower"].value = 2;
    uniforms["thicknessScale"].value = 10.0;
    const translucentMaterial = new THREE.ShaderMaterial({
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms,
      lights: true,
    });
    translucentMaterial.transparent = true;
    translucentMaterial.extensions.derivatives = true;