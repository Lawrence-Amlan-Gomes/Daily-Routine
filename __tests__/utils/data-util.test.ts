import { cleanGoogleUserForClient } from '@/lib/data-util';

describe('data-util utilities', () => {
  
  describe('cleanGoogleUserForClient', () => {
    
    it('should return null when no user is provided', () => {
      // Arrange
      const input = null;

      // Act
      const result = cleanGoogleUserForClient(input);

      // Assert
      expect(result).toBeNull();
    });

    it('should clean a valid google user object', () => {
      // Arrange
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        picture: 'https://photo.com/john.jpg'
      };

      // Act
      const result = cleanGoogleUserForClient(input);

      // Assert
      // We use toEqual for objects because toBe checks if they are the EXACT same object in memory
      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        image: 'https://photo.com/john.jpg'
      });
    });

    it('should provide a default name if missing', () => {
      // Arrange
      const input = { email: 'anonymous@example.com' };

      // Act
      const result = cleanGoogleUserForClient(input);

      // Assert
      expect(result?.name).toBe('Google User');
    });

    it('should use "image" field if "picture" is missing', () => {
      // Arrange
      const input = { 
        name: 'Jane', 
        email: 'jane@example.com', 
        image: 'https://photo.com/jane.jpg' 
      };

      // Act
      const result = cleanGoogleUserForClient(input);

      // Assert
      expect(result?.image).toBe('https://photo.com/jane.jpg');
    });

  });
});
