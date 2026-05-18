import { parseYamlString, ServiceConfig } from './yamlParser';

const validYaml = `
name: auth-service
version: "1.4.2"
image: myregistry/auth-service:1.4.2
replicas: 3
env:
  NODE_ENV: production
  LOG_LEVEL: info
ports:
  - 8080
resources:
  cpu: "500m"
  memory: "256Mi"
`;

const missingFieldsYaml = `
name: broken-service
image: myregistry/broken:latest
`;

const malformedYaml = `
name: bad-service
version: [unclosed bracket
`;

describe('parseYamlString', () => {
  it('should successfully parse a valid service YAML', () => {
    const result = parseYamlString(validYaml);
    expect(result.success).toBe(true);
    expect(result.config).toBeDefined();
    const config = result.config as ServiceConfig;
    expect(config.name).toBe('auth-service');
    expect(config.version).toBe('1.4.2');
    expect(config.image).toBe('myregistry/auth-service:1.4.2');
    expect(config.replicas).toBe(3);
    expect(config.env?.NODE_ENV).toBe('production');
    expect(config.ports).toContain(8080);
    expect(config.resources?.cpu).toBe('500m');
  });

  it('should fail when required fields are missing', () => {
    const result = parseYamlString(missingFieldsYaml);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Missing required fields/);
    expect(result.config).toBeUndefined();
  });

  it('should fail on malformed YAML', () => {
    const result = parseYamlString(malformedYaml);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Failed to parse YAML/);
  });

  it('should fail on empty YAML content', () => {
    const result = parseYamlString('');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/empty or not an object/);
  });

  it('should use provided label in filePath', () => {
    const result = parseYamlString(missingFieldsYaml, 'test-label');
    expect(result.filePath).toBe('test-label');
  });
});
